import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { editor as EditorApi } from 'monaco-editor'
import { fileMeta, isImageFile } from '../lib/files'
import { canFormat, formatSource } from '../lib/format'
import { isJsxTagStart, openTagBefore, scanSyntax, VOID_ELEMENTS, type SyntaxSpan } from '../lib/jsxSyntax'
import { setIntellisenseFiles } from '../lib/intellisense'
import { monacoUri, pathFromMonaco, setupMonaco, syncCrossLanguageLibs } from '../lib/monacoSetup'
import { editorOptions, monacoThemeId, settingsStore, suggestOptions } from '../lib/settings'
import { statusStore } from '../lib/statusStore'
import type { EditorHandle, Problem } from '../types'

type Props = {
  active: string
  visible: boolean
  getFiles: () => Record<string, string>
  onEdit: (path: string, value: string) => void
  onMarkers: (problems: Problem[]) => void
  onOpen: (path: string) => void
}

export const CodeEditor = forwardRef<EditorHandle, Props>(function CodeEditor(
  { active, visible, getFiles, onEdit, onMarkers, onOpen },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorApi.IStandaloneCodeEditor | null>(null)
  const onEditRef = useRef(onEdit)
  const onMarkersRef = useRef(onMarkers)
  const onOpenRef = useRef(onOpen)
  const getFilesRef = useRef(getFiles)
  const activeRef = useRef(active)
  const [boot, setBoot] = useState<'loading' | 'ready' | string>('loading')
  const [generation, setGeneration] = useState(0)
  onEditRef.current = onEdit
  onMarkersRef.current = onMarkers
  onOpenRef.current = onOpen
  getFilesRef.current = getFiles
  activeRef.current = active

  const handle = useRef<EditorHandle>({
    setAll() {},
    reveal() {},
    replace() {},
    async format() {},
    focus() {},
    relayout() {},
  })
  useImperativeHandle(ref, () => handle.current, [])

  useEffect(() => {
    let disposed = false
    let suppress = false
    let markerTimer = 0
    let syntaxTimer = 0
    let pauseTimer = 0
    let release = () => {}

    const bootEditor = async () => {
      const { monaco, applyWordPattern } = await import('../lib/monacoSetup')
      if (disposed || !hostRef.current) return
      setupMonaco()
      if (disposed || !hostRef.current) return

      const ensure = (path: string, content: string) => {
        const uri = monacoUri(path)
        const existing = monaco.editor.getModel(uri)
        if (existing && !existing.isDisposed()) {
          if (existing.getLanguageId() !== fileMeta(path).monaco) monaco.editor.setModelLanguage(existing, fileMeta(path).monaco)
          return existing
        }
        return monaco.editor.createModel(content, fileMeta(path).monaco, uri)
      }

      for (const [path, content] of Object.entries(getFilesRef.current())) {
        if (isImageFile(path)) continue
        ensure(path, content)
      }
      await applyWordPattern()
      setIntellisenseFiles(() => getFilesRef.current())
      syncCrossLanguageLibs(getFilesRef.current())
      const initial = activeRef.current
      const settings = settingsStore.get()
      monaco.editor.setTheme(monacoThemeId(settings.theme))
      const editor = monaco.editor.create(hostRef.current, {
        model: ensure(initial, getFilesRef.current()[initial] ?? ''),
        theme: monacoThemeId(settings.theme),
        automaticLayout: true,
        fixedOverflowWidgets: true,
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        cursorSmoothCaretAnimation: 'on',
        cursorBlinking: 'smooth',
        renderLineHighlight: 'all',
        roundedSelection: true,
        wordBasedSuggestions: 'matchingDocuments',
        parameterHints: { enabled: true },
        hover: { enabled: true, delay: 280 },
        folding: true,
        glyphMargin: false,
        lineNumbersMinChars: 3,
        overviewRulerLanes: 3,
        hideCursorInOverviewRuler: true,
        scrollbar: { useShadows: false, verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        ...suggestOptions(settings, false),
        wordSeparators: '`~!@#$%^&*()=+[{]}\\|;:\'",.<>/?',
        ...editorOptions(settings),
      })
      if (disposed) {
        editor.dispose()
        return
      }
      editorRef.current = editor
      statusStore.setLanguage(fileMeta(initial).language)

      const publishMarkers = () => {
        window.clearTimeout(markerTimer)
        markerTimer = window.setTimeout(() => {
          syncCrossLanguageLibs(getFilesRef.current())
          const problems: Problem[] = []
          for (const model of monaco.editor.getModels()) {
            if (model.uri.scheme !== 'file') continue
            const path = pathFromMonaco(model.uri)
            if (!(path in getFilesRef.current())) continue
            for (const marker of monaco.editor.getModelMarkers({ resource: model.uri })) {
              if (marker.severity < 4) continue
              problems.push({
                id: `${marker.owner}:${path}:${marker.startLineNumber}:${marker.startColumn}:${marker.message}`,
                severity: marker.severity >= 8 ? 'error' : 'warning',
                message: marker.message,
                file: path,
                line: marker.startLineNumber,
                column: marker.startColumn,
                source: marker.owner,
              })
            }
          }
          onMarkersRef.current(problems.slice(0, 200))
        }, 280)
      }

      const syntax = editor.createDecorationsCollection()
      const refreshSyntax = () => {
        window.clearTimeout(syntaxTimer)
        syntaxTimer = window.setTimeout(() => {
          const model = editor.getModel()
          if (!model || model.isDisposed()) return
          const path = pathFromMonaco(model.uri)
          const language = model.getLanguageId()
          if (!settingsStore.get().jsxHighlighting || (language !== 'typescript' && language !== 'javascript')) {
            syntax.clear()
            return
          }
          const spans = scanSyntax(model.getValue(), /\.(tsx|jsx)$/.test(path))
          syntax.set(
            spans.map((span) => {
              const start = model.getPositionAt(span.start)
              const end = model.getPositionAt(span.end)
              return {
                range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                options: { inlineClassName: span.kind },
              }
            }),
          )
        }, 40)
      }

      const autoCloseTag = (event: EditorApi.IModelContentChangedEvent) => {
        if (event.isUndoing || event.isRedoing || event.isFlush || event.changes.length !== 1) return
        const change = event.changes[0]
        if (change.rangeLength !== 0 || (change.text !== '>' && change.text !== '/')) return
        const model = editor.getModel()
        if (!model || (editor.getSelections()?.length ?? 0) > 1) return
        const path = pathFromMonaco(model.uri)
        const html = model.getLanguageId() === 'html'
        const jsx = /\.(tsx|jsx)$/.test(path)
        if (!html && !jsx) return
        const current = settingsStore.get()
        const text = model.getValue()
        const typedAt = change.rangeOffset
        const tag = openTagBefore(text, typedAt)
        if (!tag || (jsx && !isJsxTagStart(text, tag.start))) return
        const after = text.slice(typedAt + 1)
        const insertAt = (offset: number, value: string, caret: number, replace = 0) => {
          queueMicrotask(() => {
            if (editor.getModel() !== model) return
            const start = model.getPositionAt(offset)
            const end = model.getPositionAt(offset + replace)
            editor.executeEdits('auto-close-tag', [
              { range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column), text: value },
            ])
            const position = model.getPositionAt(caret)
            editor.setPosition(position)
          })
        }
        if (change.text === '/') {
          if (!current.selfClosingTags || after.startsWith('>')) return
          insertAt(typedAt + 1, '>', typedAt + 2)
          return
        }
        if (text[typedAt - 1] === '/' || text[typedAt - 1] === '=') return
        const lower = tag.name.toLowerCase()
        if (VOID_ELEMENTS.has(lower) && lower === tag.name) {
          if (jsx && current.selfClosingTags) {
            const value = text[typedAt - 1] === ' ' ? '/>' : ' />'
            insertAt(typedAt, value, typedAt + value.length, 1)
          }
          return
        }
        if (!current.autoCloseTags) return
        const closing = `</${tag.name}>`
        if (after.startsWith(closing)) return
        insertAt(typedAt + 1, closing, typedAt + 1)
      }

      const chord = (second: number) => monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, second)
      const command = (name: string) => () => {
        window.dispatchEvent(new CustomEvent('pg:command', { detail: name }))
      }
      editor.addCommand(chord(monaco.KeyCode.KeyZ), command('zen'))
      editor.addCommand(chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyT), command('themes'))
      editor.addCommand(chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS), command('shortcuts'))
      editor.addCommand(chord(monaco.KeyCode.KeyH), command('header'))
      editor.addCommand(chord(monaco.KeyCode.KeyW), command('workspace'))
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => void handle.current.format())
      editor.addAction({
        id: 'playground.formatPrettier',
        label: 'Format Document (Prettier)',
        contextMenuGroupId: '1_modification',
        contextMenuOrder: 1.5,
        run: () => handle.current.format(),
      })
      editor.addAction({
        id: 'playground.run',
        label: 'Run Preview',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 0.5,
        run: command('run'),
      })
      editor.addAction({
        id: 'playground.reveal',
        label: 'Reveal in Explorer',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 0.6,
        run: command('reveal-explorer'),
      })
      editor.addAction({
        id: 'playground.copyPath',
        label: 'Copy Path',
        contextMenuGroupId: '9_cutcopypaste',
        contextMenuOrder: 4,
        run: command('copy-path'),
      })
      editor.addAction({
        id: 'playground.downloadFile',
        label: 'Download File',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 0.7,
        run: command('download-file'),
      })
      editor.addAction({
        id: 'playground.wordWrap',
        label: 'Toggle Word Wrap',
        contextMenuGroupId: '1_modification',
        contextMenuOrder: 1.6,
        run: () => settingsStore.update({ wordWrap: settingsStore.get().wordWrap === 'on' ? 'off' : 'on' }),
      })

      let markupSpans: { key: string; spans: SyntaxSpan[] } = { key: '', spans: [] }
      const inMarkup = () => {
        const model = editor.getModel()
        const position = editor.getPosition()
        if (!model || !position || !/\.(jsx|tsx|js)$/.test(pathFromMonaco(model.uri))) return false
        const text = model.getValue()
        const offset = model.getOffsetAt(position)
        const tag = openTagBefore(text, offset)
        if (tag && isJsxTagStart(text, tag.start)) return true
        const key = `${model.uri.toString()}@${model.getVersionId()}`
        if (markupSpans.key !== key) markupSpans = { key, spans: scanSyntax(text, true).filter((span) => span.kind === 'jsx-text') }
        return markupSpans.spans.some((span) => span.start <= offset && offset <= span.end)
      }

      const tryExpandTag = () => {
        if (!settingsStore.get().emmet) return false
        const model = editor.getModel()
        const position = editor.getPosition()
        if (!model || !position || !editor.getSelection()?.isEmpty() || (editor.getSelections()?.length ?? 0) > 1) return false
        const path = pathFromMonaco(model.uri)
        const html = model.getLanguageId() === 'html'
        const script = /\.(tsx|jsx|ts|js)$/.test(path)
        if (!html && !script) return false
        const before = model.getLineContent(position.lineNumber).slice(0, position.column - 1)
        const match = /(?:<)?([A-Za-z][\w$-]*)((?:[.#][\w-]+)*)$/.exec(before)
        if (!match) return false
        const text = model.getValue()
        const offset = model.getOffsetAt(position)
        const start = offset - match[0].length
        const charBefore = start > 0 ? text[start - 1] : ''
        if (charBefore && !/[\s>]/.test(charBefore)) return false
        if (html ? Boolean(openTagBefore(text, start)) : !inMarkup()) return false
        const name = match[1]
        const lower = name.toLowerCase()
        const known = (lower === name && HTML_TAGS.has(lower)) || SVG_TAGS.has(name)
        const custom = /^[a-z][\w-]*-[\w-]+$/.test(name)
        const component = script && /^[A-Z]/.test(name)
        if (!known && !custom && !component) return false
        const classes: string[] = []
        let id = ''
        for (const seg of match[2].match(/[.#][\w-]+/g) ?? []) {
          if (seg[0] === '.') classes.push(seg.slice(1))
          else id = seg.slice(1)
        }
        const attrs: string[] = []
        if (id) attrs.push(`id="${id}"`)
        if (classes.length) attrs.push(`${script ? 'className' : 'class'}="${classes.join(' ')}"`)
        const attrText = attrs.length ? ` ${attrs.join(' ')}` : ''
        const selfClose = script && VOID_ELEMENTS.has(lower) && lower === name
        const insert = selfClose ? `<${name}${attrText} />` : `<${name}${attrText}></${name}>`
        const caretOffset = selfClose ? insert.length : 1 + name.length + attrText.length + 1
        const startPos = model.getPositionAt(start)
        const endPos = model.getPositionAt(offset)
        editor.executeEdits('expand-tag', [
          { range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column), text: insert },
        ])
        const caret = model.getPositionAt(start + caretOffset)
        editor.setPosition(caret)
        return true
      }

      let suggestMode = ''
      const syncSuggest = () => {
        const model = editor.getModel()
        const position = editor.getPosition()
        const language = model?.getLanguageId()
        const script = language === 'javascript' || language === 'typescript'
        const restricted = Boolean(script && model && position && !inStringOrClass(model.getLineContent(position.lineNumber).slice(0, position.column - 1)) && !inMarkup())
        const current = settingsStore.get()
        const mode = `${restricted}:${current.jsSuggestions}:${current.jsAcceptSuggestions}`
        if (mode === suggestMode) return
        suggestMode = mode
        editor.updateOptions(suggestOptions(current, restricted))
      }

      const subscriptions = [
        editor.onDidChangeModelContent((event) => {
          refreshSyntax()
          if (suppress) return
          const model = editor.getModel()
          if (!model) return
          onEditRef.current(pathFromMonaco(model.uri), model.getValue())
          autoCloseTag(event)
          window.clearTimeout(pauseTimer)
          pauseTimer = window.setTimeout(() => {
            if (editor.getModel() !== model) return
            if (settingsStore.get().formatOnPause) void handle.current.format(true)
          }, 1000)
        }),
        editor.onDidChangeModel(() => {
          refreshSyntax()
          syncSuggest()
        }),
        editor.onDidChangeCursorPosition((event) => {
          statusStore.setCursor(event.position.lineNumber, event.position.column)
          syncSuggest()
        }),
        monaco.editor.onDidChangeMarkers(publishMarkers),
        monaco.editor.registerEditorOpener({
          openCodeEditor(_source, resource, selectionOrPosition) {
            if (resource.scheme !== 'file') return false
            const path = pathFromMonaco(resource)
            if (!(path in getFilesRef.current())) return false
            if (isImageFile(path)) {
              onOpenRef.current(path)
              return true
            }
            const model = ensure(path, getFilesRef.current()[path] ?? '')
            if (editor.getModel() !== model) editor.setModel(model)
            onOpenRef.current(path)
            if (selectionOrPosition && 'startLineNumber' in selectionOrPosition) {
              editor.setSelection(selectionOrPosition)
              editor.revealRangeInCenterIfOutsideViewport(selectionOrPosition)
            } else if (selectionOrPosition) {
              editor.setPosition(selectionOrPosition)
              editor.revealPositionInCenterIfOutsideViewport(selectionOrPosition)
            }
            editor.focus()
            return true
          },
        }),
        editor.onKeyDown((event) => {
          if (event.keyCode !== monaco.KeyCode.Enter || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
          const row = editor.getContainerDomNode().ownerDocument.querySelector('.suggest-widget.visible .monaco-list-row.focused')
          if (!row) {
            if (tryExpandTag()) {
              event.preventDefault()
              event.stopPropagation()
            }
            return
          }
          const emmet = /emmet/i.test(`${row.getAttribute('aria-label') ?? ''} ${row.textContent ?? ''}`)
          if (!emmet && !inMarkup()) return
          event.preventDefault()
          event.stopPropagation()
          editor.trigger('keyboard', 'acceptSelectedSuggestion', {})
        }),
      ]
      publishMarkers()
      refreshSyntax()
      const stopSettings = settingsStore.subscribe(() => {
        const next = settingsStore.get()
        monaco.editor.setTheme(monacoThemeId(next.theme))
        editor.updateOptions(editorOptions(next))
        suggestMode = ''
        syncSuggest()
        refreshSyntax()
      })
      const host = editor.getContainerDomNode()
      const onWheel = (event: WheelEvent) => {
        if (!(event.ctrlKey || event.metaKey) || !settingsStore.get().mouseWheelZoom || event.deltaY === 0) return
        event.preventDefault()
        event.stopPropagation()
        settingsStore.update({ fontSize: settingsStore.get().fontSize + (event.deltaY < 0 ? 1 : -1) })
      }
      host.addEventListener('wheel', onWheel, { capture: true, passive: false })

      handle.current.setAll = (files, nextActive) => {
        suppress = true
        const keep = new Set(Object.keys(files))
        for (const model of monaco.editor.getModels()) {
          if (model.uri.scheme !== 'file') continue
          const path = pathFromMonaco(model.uri)
          if (!keep.has(path)) model.dispose()
        }
        for (const [path, content] of Object.entries(files)) {
          if (isImageFile(path)) continue
          const model = ensure(path, content)
          if (model.getValue() !== content) model.setValue(content)
        }
        if (isImageFile(nextActive)) {
          suppress = false
          syncCrossLanguageLibs(files)
          statusStore.setLanguage(fileMeta(nextActive).language)
          return
        }
        editor.setModel(ensure(nextActive, files[nextActive] ?? ''))
        editor.setPosition({ lineNumber: 1, column: 1 })
        suppress = false
        syncCrossLanguageLibs(files)
        statusStore.setLanguage(fileMeta(nextActive).language)
      }
      handle.current.reveal = (path, line, column) => {
        if (isImageFile(path)) return
        const model = ensure(path, getFilesRef.current()[path] ?? '')
        if (editor.getModel() !== model) editor.setModel(model)
        const position = { lineNumber: Math.max(1, line), column: Math.max(1, column) }
        editor.setPosition(position)
        editor.revealPositionInCenter(position)
        editor.focus()
      }
      handle.current.replace = (path, value) => {
        if (isImageFile(path)) return
        const model = ensure(path, getFilesRef.current()[path] ?? '')
        model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value }], () => null)
        onEditRef.current(path, value)
      }
      handle.current.format = async (quiet = false) => {
        const model = editor.getModel()
        if (!model) return
        const path = pathFromMonaco(model.uri)
        if (isImageFile(path)) return
        if (!canFormat(path)) {
          if (!quiet) await editor.getAction('editor.action.formatDocument')?.run()
          return
        }
        const source = model.getValue()
        const version = model.getVersionId()
        try {
          const formatted = await formatSource(path, source)
          if (model.isDisposed() || model.getVersionId() !== version) return
          if (formatted === source) {
            if (!quiet) statusStore.flash('Already formatted')
            return
          }
          const position = editor.getPosition()
          const top = editor.getScrollTop()
          editor.pushUndoStop()
          editor.executeEdits('prettier', [{ range: model.getFullModelRange(), text: formatted, forceMoveMarkers: true }])
          editor.pushUndoStop()
          if (position) {
            const lineNumber = Math.min(position.lineNumber, model.getLineCount())
            editor.setPosition({ lineNumber, column: Math.min(position.column, model.getLineMaxColumn(lineNumber)) })
          }
          editor.setScrollTop(top)
          if (!quiet) statusStore.flash(`Formatted ${path.split('/').pop()} with Prettier`)
        } catch (error) {
          if (quiet) return
          const message = error instanceof Error ? error.message.split('\n')[0] : 'Unknown error'
          statusStore.flash(`Format failed: ${message}`, 4000)
        }
      }
      type SuggestItem = { completion: { label: string | { label: string }; kind: number } }
      type SuggestController = { onWillInsertSuggestItem: (listener: (event: { item: SuggestItem }) => void) => { dispose: () => void } }
      const suggestController = editor.getContribution('editor.contrib.suggestController') as unknown as SuggestController | null
      const braceAttributes = new Set(['style', 'ref', 'key', 'checked', 'disabled', 'hidden', 'children', 'autoFocus', 'defaultChecked', 'readOnly', 'required', 'multiple', 'tabIndex'])
      const attributeValue = suggestController?.onWillInsertSuggestItem(({ item }) => {
        const label = typeof item.completion.label === 'string' ? item.completion.label : item.completion.label.label
        const kind = item.completion.kind
        if ((kind !== monaco.languages.CompletionItemKind.Property && kind !== monaco.languages.CompletionItemKind.Field) || !/^[A-Za-z_][\w-]*$/.test(label)) return
        const model = editor.getModel()
        if (!model || !/\.(tsx|jsx)$/.test(model.uri.path)) return
        const version = model.getVersionId()
        window.setTimeout(() => {
          const position = editor.getPosition()
          if (editor.getModel() !== model || model.getVersionId() === version || !position) return
          const text = model.getValue()
          const offset = model.getOffsetAt(position)
          const start = offset - label.length
          if (text.slice(start, offset) !== label || !/\s/.test(text[start - 1] ?? '') || /^\s*=/.test(text.slice(offset, offset + 40))) return
          const tag = openTagBefore(text, start)
          if (!tag || !isJsxTagStart(text, tag.start)) return
          const braces = /^on[A-Z]/.test(label) || braceAttributes.has(label)
          const { lineNumber, column } = position
          editor.executeEdits('attribute-value', [{ range: new monaco.Range(lineNumber, column, lineNumber, column), text: braces ? '={}' : '=""' }])
          editor.setPosition({ lineNumber, column: column + 2 })
          if (!braces) editor.trigger('attribute-value', 'editor.action.triggerSuggest', {})
        }, 0)
      })
      if (attributeValue) subscriptions.push(attributeValue)
      handle.current.focus = () => editor.focus()
      handle.current.relayout = () => {
        editor.layout()
        editor.render(true)
      }

      release = () => {
        stopSettings()
        host.removeEventListener('wheel', onWheel, { capture: true })
        syntax.clear()
        subscriptions.forEach((item) => item.dispose())
        editor.dispose()
        for (const model of monaco.editor.getModels()) if (model.uri.scheme === 'file') model.dispose()
      }
      if (!disposed) {
        setBoot('ready')
        setGeneration((value) => value + 1)
      }
    }

    void bootEditor().catch((error: unknown) => {
      if (!disposed) setBoot(error instanceof Error ? error.message : 'Editor failed to load')
    })

    return () => {
      disposed = true
      window.clearTimeout(markerTimer)
      window.clearTimeout(syntaxTimer)
      window.clearTimeout(pauseTimer)
      release()
      editorRef.current = null
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || generation === 0) return
    let cancelled = false
    void import('../lib/monacoSetup').then(({ monaco }) => {
      if (cancelled) return
      const content = getFiles()[active]
      if (content == null) return
      if (isImageFile(active)) {
        statusStore.setLanguage(fileMeta(active).language)
        return
      }
      const uri = monacoUri(active)
      let model = monaco.editor.getModel(uri)
      if (!model || model.isDisposed()) model = monaco.editor.createModel(content, fileMeta(active).monaco, uri)
      if (editor.getModel() !== model) editor.setModel(model)
      statusStore.setLanguage(fileMeta(active).language)
      const position = editor.getPosition()
      if (position) statusStore.setCursor(position.lineNumber, position.column)
      if (visible) editor.focus()
    })
    return () => {
      cancelled = true
    }
  }, [active, generation, getFiles, visible])

  useEffect(() => {
    if (visible) editorRef.current?.layout()
  }, [visible, generation])

  return (
    <div className="relative min-h-0 flex-1 bg-editor">
      <div ref={hostRef} className="editor-host" data-testid="editor" />
      {boot !== 'ready' && (
        <div className="absolute inset-0 grid place-items-center bg-editor px-6 text-center text-sm text-muted">
          <div className="flex max-w-sm flex-col items-center gap-3">
            {boot === 'loading' && <span className="h-8 w-8 animate-spin rounded-full border-2 border-fg/10 border-t-accent" />}
            <p>{boot === 'loading' ? 'Loading editor and Tailwind IntelliSense…' : boot}</p>
          </div>
        </div>
      )}
    </div>
  )
})

const HTML_TAGS = new Set(
  'a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr'.split(
    ' ',
  ),
)

const SVG_TAGS = new Set(
  'svg path circle rect line ellipse polygon polyline g defs use symbol text tspan clipPath mask marker pattern linearGradient radialGradient stop image foreignObject'.split(' '),
)

function inStringOrClass(before: string) {
  let quote = ''
  for (let index = 0; index < before.length; index += 1) {
    const char = before[index]
    if (quote) {
      if (char === '\\') index += 1
      else if (char === quote) quote = ''
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char
    }
  }
  return quote !== ''
}
