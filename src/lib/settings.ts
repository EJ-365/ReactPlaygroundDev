import { applyThemeVariables, DEFAULT_THEME_ID, resolveThemeId, themeById } from './themes'

export type WorkbenchTheme = string
export type FontChoice = 'jetbrains' | 'fira' | 'cascadia' | 'system'
export type LineNumbers = 'on' | 'off' | 'relative'

export type Settings = {
  theme: WorkbenchTheme
  fontSize: number
  panelFontSize: number
  fontFamily: FontChoice
  fontLigatures: boolean
  tabSize: 2 | 4
  wordWrap: 'off' | 'on'
  minimap: boolean
  lineNumbers: LineNumbers
  cursorStyle: 'line' | 'block' | 'underline'
  renderWhitespace: 'none' | 'selection' | 'all'
  formatOnPaste: boolean
  autoClosingBrackets: 'always' | 'languageDefined' | 'never'
  smoothScrolling: boolean
  bracketPairs: boolean
  stickyScroll: boolean
  mouseWheelZoom: boolean
  autoCloseTags: boolean
  selfClosingTags: boolean
  renameTags: boolean
  jsxHighlighting: boolean
  emmet: boolean
  reactSnippets: boolean
  inlayHints: boolean
  formatOnSave: boolean
  formatSemicolons: boolean
  formatSingleQuote: boolean
  formatPrintWidth: 80 | 100 | 120
  autoSave: boolean
  showHeader: boolean
  jsSuggestions: 'typing' | 'manual'
  jsAcceptSuggestions: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  theme: DEFAULT_THEME_ID,
  fontSize: 13,
  panelFontSize: 13,
  fontFamily: 'jetbrains',
  fontLigatures: true,
  tabSize: 2,
  wordWrap: 'off',
  minimap: true,
  lineNumbers: 'on',
  cursorStyle: 'line',
  renderWhitespace: 'selection',
  formatOnPaste: true,
  autoClosingBrackets: 'always',
  smoothScrolling: true,
  bracketPairs: true,
  stickyScroll: true,
  mouseWheelZoom: true,
  autoCloseTags: true,
  selfClosingTags: true,
  renameTags: true,
  jsxHighlighting: true,
  emmet: true,
  reactSnippets: true,
  inlayHints: true,
  formatOnSave: false,
  formatSemicolons: false,
  formatSingleQuote: true,
  formatPrintWidth: 100,
  autoSave: true,
  showHeader: true,
  jsSuggestions: 'typing',
  jsAcceptSuggestions: false,
}

const KEY = 'react-playground.settings'

function clamp(settings: Partial<Settings> | null | undefined): Settings {
  const next = { ...DEFAULT_SETTINGS, ...settings }
  next.fontSize = Math.min(28, Math.max(10, Math.round(Number(next.fontSize) || DEFAULT_SETTINGS.fontSize)))
  next.panelFontSize = Math.min(24, Math.max(10, Math.round(Number(next.panelFontSize) || DEFAULT_SETTINGS.panelFontSize)))
  if (next.tabSize !== 2 && next.tabSize !== 4) next.tabSize = 2
  next.theme = resolveThemeId(next.theme)
  if (next.fontFamily !== 'fira' && next.fontFamily !== 'cascadia' && next.fontFamily !== 'system') next.fontFamily = 'jetbrains'
  next.fontLigatures = next.fontLigatures !== false
  next.autoCloseTags = next.autoCloseTags !== false
  next.selfClosingTags = next.selfClosingTags !== false
  next.renameTags = next.renameTags !== false
  next.jsxHighlighting = next.jsxHighlighting !== false
  next.emmet = next.emmet !== false
  next.reactSnippets = next.reactSnippets !== false
  next.inlayHints = next.inlayHints !== false
  next.formatOnSave = next.formatOnSave === true
  next.formatSemicolons = next.formatSemicolons === true
  next.formatSingleQuote = next.formatSingleQuote !== false
  if (next.formatPrintWidth !== 80 && next.formatPrintWidth !== 120) next.formatPrintWidth = 100
  next.autoSave = next.autoSave !== false
  next.showHeader = next.showHeader !== false
  if (next.jsSuggestions !== 'manual') next.jsSuggestions = 'typing'
  next.jsAcceptSuggestions = next.jsAcceptSuggestions === true
  if (next.wordWrap !== 'on') next.wordWrap = 'off'
  if (next.lineNumbers !== 'off' && next.lineNumbers !== 'relative') next.lineNumbers = 'on'
  if (next.cursorStyle !== 'block' && next.cursorStyle !== 'underline') next.cursorStyle = 'line'
  if (next.renderWhitespace !== 'none' && next.renderWhitespace !== 'all') next.renderWhitespace = 'selection'
  if (next.autoClosingBrackets !== 'never' && next.autoClosingBrackets !== 'languageDefined') next.autoClosingBrackets = 'always'
  return next
}

let current = load()
const listeners = new Set<() => void>()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return clamp(JSON.parse(raw) as Partial<Settings>)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function emit() {
  applyThemeVariables(themeById(current.theme))
  for (const listener of listeners) listener()
}

emit()

export const settingsStore = {
  get: () => current,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  update(patch: Partial<Settings>) {
    current = clamp({ ...current, ...patch })
    try {
      localStorage.setItem(KEY, JSON.stringify(current))
    } catch {
      // The session still applies the change.
    }
    emit()
  },
  reset() {
    current = { ...DEFAULT_SETTINGS }
    try {
      localStorage.removeItem(KEY)
    } catch {
      // Ignore storage failures.
    }
    emit()
  },
}

export function fontStack(choice: FontChoice) {
  if (choice === 'fira') return '"Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace'
  if (choice === 'cascadia') return '"Cascadia Code", "Fira Code", "JetBrains Mono", ui-monospace, monospace'
  if (choice === 'system') return 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  return '"JetBrains Mono", "Cascadia Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
}

export function monacoThemeId(theme: WorkbenchTheme) {
  return `pg-${resolveThemeId(theme)}`
}

export function suggestOptions(settings: Settings, restricted: boolean) {
  const typing = !restricted || settings.jsSuggestions === 'typing'
  const fill = !restricted || settings.jsAcceptSuggestions
  return {
    quickSuggestions: typing ? { other: true, comments: false, strings: true } : false,
    suggestOnTriggerCharacters: typing,
    acceptSuggestionOnEnter: 'on' as const,
    acceptSuggestionOnCommitCharacter: fill,
    inlineSuggest: { enabled: fill },
    suggest: { preview: fill, showIcons: true, showStatusBar: true, snippetsPreventQuickSuggestions: false },
  }
}

export function editorOptions(settings: Settings) {
  return {
    fontSize: settings.fontSize,
    lineHeight: Math.round(settings.fontSize * 1.65),
    fontFamily: fontStack(settings.fontFamily),
    fontLigatures: settings.fontLigatures && settings.fontFamily !== 'system',
    tabSize: settings.tabSize,
    insertSpaces: true,
    detectIndentation: false,
    wordWrap: settings.wordWrap,
    minimap: { enabled: settings.minimap, scale: 1, showSlider: 'mouseover' as const },
    lineNumbers: settings.lineNumbers,
    cursorStyle: settings.cursorStyle,
    renderWhitespace: settings.renderWhitespace,
    formatOnPaste: settings.formatOnPaste,
    autoClosingBrackets: settings.autoClosingBrackets,
    smoothScrolling: settings.smoothScrolling,
    bracketPairColorization: { enabled: settings.bracketPairs },
    guides: { bracketPairs: settings.bracketPairs, indentation: true },
    stickyScroll: { enabled: settings.stickyScroll },
    mouseWheelZoom: false,
    linkedEditing: settings.renameTags,
    inlayHints: { enabled: settings.inlayHints ? ('on' as const) : ('off' as const) },
  }
}
