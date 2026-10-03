import type * as Monaco from 'monaco-editor'
import { componentName, relativeImport } from './files'

type Kind = 'default' | 'named'

type SymbolExport = {
  name: string
  kind: Kind
  path: string
}

let readFiles = () => ({}) as Record<string, string>

export function setIntellisenseFiles(getFiles: () => Record<string, string>) {
  readFiles = getFiles
}

function collect(source: string, path: string): SymbolExport[] {
  const symbols: SymbolExport[] = []
  const seen = new Set<string>()
  const add = (name: string, kind: Kind) => {
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) return
    const key = `${kind}:${name}`
    if (seen.has(key)) return
    seen.add(key)
    symbols.push({ name, kind, path })
  }

  for (const match of source.matchAll(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/g)) add(match[1], 'default')
  for (const match of source.matchAll(/export\s+default\s+class\s+([A-Za-z_$][\w$]*)/g)) add(match[1], 'default')
  if (!symbols.some((symbol) => symbol.kind === 'default' && symbol.path === path)) {
    const ident = source.match(/export\s+default\s+([A-Za-z_$][\w$]*)\b/)
    if (ident && ident[1] !== 'function' && ident[1] !== 'class' && ident[1] !== 'async') add(ident[1], 'default')
    else if (/export\s+default\b/.test(source)) add(componentName(path), 'default')
  }
  for (const match of source.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) add(match[1], 'named')
  for (const match of source.matchAll(/export\s+class\s+([A-Za-z_$][\w$]*)/g)) add(match[1], 'named')
  for (const match of source.matchAll(/export\s+(?:const|let|var|enum|type|interface)\s+([A-Za-z_$][\w$]*)/g)) add(match[1], 'named')
  for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of match[1].split(',')) {
      const piece = part.trim().replace(/^type\s+/, '')
      if (!piece) continue
      const sides = piece.split(/\s+as\s+/)
      const exported = (sides[1] ?? sides[0]).trim()
      if (exported === 'default') continue
      const isDefault = sides[0].trim() === 'default'
      add(exported, isDefault ? 'default' : 'named')
    }
  }
  return symbols
}

const PACKAGES: { specifier: string; names: string[] }[] = [
  {
    specifier: 'react',
    names: [
      'useState', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useRef', 'useId', 'useContext', 'useReducer',
      'useDeferredValue', 'useTransition', 'useImperativeHandle', 'useSyncExternalStore', 'useInsertionEffect', 'useOptimistic',
      'useActionState', 'use', 'createContext', 'createElement', 'cloneElement', 'isValidElement', 'memo', 'forwardRef', 'lazy',
      'startTransition', 'Fragment', 'StrictMode', 'Suspense', 'Children', 'Component', 'PureComponent',
    ],
  },
  { specifier: 'react-dom', names: ['createPortal', 'flushSync'] },
  { specifier: 'react-dom/client', names: ['createRoot', 'hydrateRoot'] },
]

const PACKAGE_TYPES = ['ReactNode', 'ReactElement', 'FC', 'PropsWithChildren', 'CSSProperties', 'Dispatch', 'SetStateAction', 'RefObject', 'ChangeEvent', 'FormEvent', 'MouseEvent', 'KeyboardEvent']

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function alreadyImported(source: string, name: string, specifier: string) {
  const pattern = new RegExp(`import[\\s\\S]{0,180}?\\b${name}\\b[\\s\\S]{0,80}?from\\s+['"]${escapeRegExp(specifier)}['"]`)
  return pattern.test(source)
}

function declared(source: string, name: string) {
  const id = escapeRegExp(name)
  return (
    new RegExp(`\\bimport\\s+(?:type\\s+)?(?:[\\w$]+\\s*,\\s*)?(?:\\{[^}]*\\b${id}\\b[^}]*\\}|${id}\\b|\\*\\s+as\\s+${id}\\b)`).test(source) ||
    new RegExp(`\\b(?:const|let|var|function|class|type|interface|enum)\\s+${id}\\b`).test(source)
  )
}

function importEdit(monaco: typeof Monaco, model: Monaco.editor.ITextModel, name: string, kind: Kind, specifier: string): Monaco.languages.TextEdit[] {
  const source = model.getValue()
  if (alreadyImported(source, name, specifier)) return []
  const existing = new RegExp(`^([ \\t]*)import\\s+(?!type\\b)([^;'"]*?)\\s+from\\s+(['"])${escapeRegExp(specifier)}\\3`, 'm').exec(source)
  if (existing && !existing[2].includes('*')) {
    const clause = existing[2]
    const braces = /\{([^}]*)\}/.exec(clause)
    const defaultName = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim()
    const named = braces ? braces[1].split(',').map((part) => part.trim()).filter(Boolean) : []
    let next = ''
    if (kind === 'default' && !defaultName) next = named.length ? `${name}, { ${named.join(', ')} }` : name
    if (kind === 'named') next = `${defaultName ? `${defaultName}, ` : ''}{ ${[...named, name].join(', ')} }`
    if (next) {
      const from = existing.index + existing[1].length
      const to = existing.index + existing[0].length
      const startPos = model.getPositionAt(from)
      const endPos = model.getPositionAt(to)
      const quote = existing[3]
      return [{ range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column), text: `import ${next} from ${quote}${specifier}${quote}` }]
    }
  }
  let insertLine = 1
  for (let line = 1; line <= model.getLineCount(); line += 1) {
    if (/^\s*import\s/.test(model.getLineContent(line))) insertLine = line + 1
  }
  const statement = kind === 'default' ? `import ${name} from '${specifier}'\n` : `import { ${name} } from '${specifier}'\n`
  return [{ range: new monaco.Range(insertLine, 1, insertLine, 1), text: statement }]
}

function isModule(path: string, source: string, files: Record<string, string>) {
  if (/\.(tsx|jsx|ts)$/.test(path) || /^\s*(import|export)\b/m.test(source)) return true
  return Object.keys(files).some((file) => /(^|\/)main\.(tsx|jsx)$/.test(file))
}

function inStringOrComment(before: string) {
  let quote = ''
  for (let at = 0; at < before.length; at += 1) {
    const ch = before[at]
    if (quote) {
      if (ch === '\\') at += 1
      else if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'" || ch === '`') quote = ch
    else if (ch === '/' && before[at + 1] === '/') return true
  }
  return Boolean(quote)
}

export function registerProjectIntellisense(monaco: typeof Monaco) {
  const provider: Monaco.languages.CompletionItemProvider = {
    triggerCharacters: ['<', "'", '"', '/'],
    provideCompletionItems(model, position) {
      const files = readFiles()
      const path = decodeURIComponent(model.uri.path.replace(/^\//, ''))
      if (!(path in files)) return { suggestions: [] }
      const line = model.getLineContent(position.lineNumber)
      const before = line.slice(0, position.column - 1)
      const word = model.getWordUntilPosition(position)
      const wordRange = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)

      const importMatch = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]*)$/.exec(before)
      if (importMatch) {
        const typed = importMatch[1]
        const start = position.column - typed.length
        const range = new monaco.Range(position.lineNumber, start, position.lineNumber, position.column)
        const suggestions = Object.keys(files)
          .filter((file) => file !== path)
          .map((file) => {
            const spec = relativeImport(path, file)
            return {
              label: spec,
              kind: file.endsWith('.css')
                ? monaco.languages.CompletionItemKind.Color
                : monaco.languages.CompletionItemKind.File,
              insertText: spec,
              range,
              detail: file,
              sortText: spec,
            }
          })
          .filter((item) => item.insertText.toLowerCase().includes(typed.toLowerCase()))
        return { suggestions }
      }

      const jsx = /<([A-Za-z][\w$]*)?$/.exec(before)
      const prefix = (jsx?.[1] ?? word.word).trim()
      const inJsx = Boolean(jsx)
      const source = model.getValue()
      if (!isModule(path, source, files)) return { suggestions: [] }
      if (!inJsx && (!prefix || before.slice(0, word.startColumn - 1).endsWith('.') || inStringOrComment(before))) return { suggestions: [] }
      if (prefix && prefix[0] === prefix[0].toLowerCase() && (inJsx || prefix.length < 2)) return { suggestions: [] }

      const suggestions: Monaco.languages.CompletionItem[] = []
      const range = inJsx && !word.word ? new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column) : wordRange
      const matches = (name: string) => !prefix || name.toLowerCase().startsWith(prefix.toLowerCase())
      const offer = (name: string, kind: Kind, specifier: string, itemKind: Monaco.languages.CompletionItemKind, detail: string, rank: string) => {
        suggestions.push({
          label: { label: name, description: specifier },
          kind: itemKind,
          insertText: name,
          range,
          detail,
          documentation: `Adds import from '${specifier}'`,
          sortText: `\u0000${rank}${name}`,
          preselect: suggestions.length === 0 && Boolean(prefix),
          additionalTextEdits: importEdit(monaco, model, name, kind, specifier),
          filterText: name,
        })
      }

      const typescript = /\.(tsx|ts)$/.test(path)
      for (const pkg of PACKAGES) {
        for (const name of [...pkg.names, ...(pkg.specifier === 'react' && typescript ? PACKAGE_TYPES : [])]) {
          const component = /^[A-Z]/.test(name)
          if (inJsx && !['Fragment', 'StrictMode', 'Suspense'].includes(name)) continue
          if (!matches(name) || declared(source, name)) continue
          const itemKind = PACKAGE_TYPES.includes(name) ? monaco.languages.CompletionItemKind.Interface : component ? monaco.languages.CompletionItemKind.Class : monaco.languages.CompletionItemKind.Function
          offer(name, 'named', pkg.specifier, itemKind, `Auto import from '${pkg.specifier}'`, '0')
        }
      }

      for (const [file, fileSource] of Object.entries(files)) {
        if (file === path || !/\.(tsx|ts|jsx|js)$/.test(file)) continue
        for (const symbol of collect(fileSource, file)) {
          const component = /[A-Z]/.test(symbol.name[0] ?? '')
          if (inJsx && !component) continue
          if (!matches(symbol.name) || declared(source, symbol.name)) continue
          const specifier = relativeImport(path, file)
          const detail = symbol.kind === 'default' ? `Auto import default from '${specifier}'` : `Auto import from '${specifier}'`
          offer(symbol.name, symbol.kind, specifier, component ? monaco.languages.CompletionItemKind.Class : monaco.languages.CompletionItemKind.Function, detail, symbol.kind === 'default' ? '1' : '2')
          if (suggestions.length >= 60) break
        }
      }
      return { suggestions }
    },
  }

  for (const language of ['typescript', 'javascript'] as const) {
    monaco.languages.registerCompletionItemProvider(language, provider)
  }
}
