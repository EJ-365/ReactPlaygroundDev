export type ThemeKind = 'dark' | 'light' | 'contrast'

export type ThemeUi = {
  app: string
  sidebar: string
  editor: string
  elevated: string
  tabs: string
  statusbar: string
  statusFg: string
  fg: string
  muted: string
  accent: string
  accentFg: string
}

export type ThemeSyntax = {
  fg: string
  comment: string
  keyword: string
  control: string
  string: string
  number: string
  regexp: string
  type: string
  fn: string
  variable: string
  constant: string
  punctuation: string
  tag: string
  component: string
  attr: string
  cssProperty: string
  cssSelector: string
  lineNumber: string
  lineNumberActive: string
  selection: string
  lineHighlight: string
  cursor: string
  indentGuide: string
}

export type ThemeDef = {
  id: string
  label: string
  kind: ThemeKind
  colorful?: boolean
  ui: ThemeUi
  syntax: ThemeSyntax
}

const DARK_PLUS: ThemeDef = {
  id: 'dark-plus',
  label: 'Dark+ (VS Code)',
  kind: 'dark',
  ui: { app: '#181818', sidebar: '#181818', editor: '#1f1f1f', elevated: '#252526', tabs: '#181818', statusbar: '#007acc', statusFg: '#ffffff', fg: '#cccccc', muted: '#9d9d9d', accent: '#0e8ae6', accentFg: '#ffffff' },
  syntax: {
    fg: '#d4d4d4', comment: '#6a9955', keyword: '#569cd6', control: '#c586c0', string: '#ce9178', number: '#b5cea8', regexp: '#d16969',
    type: '#4ec9b0', fn: '#dcdcaa', variable: '#9cdcfe', constant: '#4fc1ff', punctuation: '#808080', tag: '#569cd6', component: '#4ec9b0', attr: '#9cdcfe',
    cssProperty: '#9cdcfe', cssSelector: '#d7ba7d', lineNumber: '#6e7681', lineNumberActive: '#cccccc', selection: '#264f78', lineHighlight: '#ffffff0a', cursor: '#aeafad', indentGuide: '#404040',
  },
}

export const THEMES: ThemeDef[] = [
  DARK_PLUS,
  {
    id: 'light-plus',
    label: 'Light+ (VS Code)',
    kind: 'light',
    ui: { app: '#f8f8f8', sidebar: '#f8f8f8', editor: '#ffffff', elevated: '#ffffff', tabs: '#f8f8f8', statusbar: '#007acc', statusFg: '#ffffff', fg: '#3b3b3b', muted: '#6b6b6b', accent: '#005fb8', accentFg: '#ffffff' },
    syntax: {
      fg: '#000000', comment: '#008000', keyword: '#0000ff', control: '#af00db', string: '#a31515', number: '#098658', regexp: '#811f3f',
      type: '#267f99', fn: '#795e26', variable: '#001080', constant: '#0070c1', punctuation: '#800000', tag: '#800000', component: '#267f99', attr: '#e50000',
      cssProperty: '#e50000', cssSelector: '#800000', lineNumber: '#6e7681', lineNumberActive: '#171184', selection: '#add6ff', lineHighlight: '#0000000a', cursor: '#000000', indentGuide: '#d3d3d3',
    },
  },
  {
    id: 'midnight',
    label: 'Playground Midnight',
    kind: 'dark',
    ui: { app: '#090b10', sidebar: '#0c0f16', editor: '#0e1117', elevated: '#141924', tabs: '#0c0f16', statusbar: '#10141d', statusFg: '#a3acbd', fg: '#e7eaf0', muted: '#8a93a6', accent: '#8b7cff', accentFg: '#ffffff' },
    syntax: {
      fg: '#e7eaf0', comment: '#6d7588', keyword: '#c4b5fd', control: '#f0abfc', string: '#c6e7c2', number: '#f0c989', regexp: '#fda4af',
      type: '#7dd3fc', fn: '#93c5fd', variable: '#e7eaf0', constant: '#fcd34d', punctuation: '#6d7588', tag: '#f472b6', component: '#7dd3fc', attr: '#c4b5fd',
      cssProperty: '#7dd3fc', cssSelector: '#f472b6', lineNumber: '#4c5568', lineNumberActive: '#c4b5fd', selection: '#8b7cff40', lineHighlight: '#ffffff0a', cursor: '#d8d2ff', indentGuide: '#222838',
    },
  },
  {
    id: 'one-dark-pro',
    label: 'One Dark Pro',
    kind: 'dark',
    ui: { app: '#21252b', sidebar: '#21252b', editor: '#282c34', elevated: '#2c313a', tabs: '#21252b', statusbar: '#21252b', statusFg: '#9da5b4', fg: '#d7dae0', muted: '#8b929f', accent: '#528bff', accentFg: '#ffffff' },
    syntax: {
      fg: '#abb2bf', comment: '#7f848e', keyword: '#c678dd', control: '#c678dd', string: '#98c379', number: '#d19a66', regexp: '#56b6c2',
      type: '#e5c07b', fn: '#61afef', variable: '#e06c75', constant: '#d19a66', punctuation: '#abb2bf', tag: '#e06c75', component: '#e5c07b', attr: '#d19a66',
      cssProperty: '#abb2bf', cssSelector: '#e06c75', lineNumber: '#495162', lineNumberActive: '#abb2bf', selection: '#3e4451', lineHighlight: '#2c313c', cursor: '#528bff', indentGuide: '#3b4048',
    },
  },
  {
    id: 'dracula',
    label: 'Dracula',
    kind: 'dark',
    colorful: true,
    ui: { app: '#191a21', sidebar: '#21222c', editor: '#282a36', elevated: '#343746', tabs: '#191a21', statusbar: '#bd93f9', statusFg: '#191a21', fg: '#f8f8f2', muted: '#a4a8c4', accent: '#bd93f9', accentFg: '#191a21' },
    syntax: {
      fg: '#f8f8f2', comment: '#6272a4', keyword: '#ff79c6', control: '#ff79c6', string: '#f1fa8c', number: '#bd93f9', regexp: '#ff5555',
      type: '#8be9fd', fn: '#50fa7b', variable: '#f8f8f2', constant: '#bd93f9', punctuation: '#f8f8f2', tag: '#ff79c6', component: '#8be9fd', attr: '#50fa7b',
      cssProperty: '#8be9fd', cssSelector: '#50fa7b', lineNumber: '#6272a4', lineNumberActive: '#f8f8f2', selection: '#44475a', lineHighlight: '#44475a75', cursor: '#f8f8f0', indentGuide: '#3b3f51',
    },
  },
  {
    id: 'monokai',
    label: 'Monokai',
    kind: 'dark',
    colorful: true,
    ui: { app: '#1e1f1c', sidebar: '#1e1f1c', editor: '#272822', elevated: '#34352f', tabs: '#1e1f1c', statusbar: '#414339', statusFg: '#f8f8f2', fg: '#f8f8f2', muted: '#a59f85', accent: '#a6e22e', accentFg: '#1e1f1c' },
    syntax: {
      fg: '#f8f8f2', comment: '#88846f', keyword: '#f92672', control: '#f92672', string: '#e6db74', number: '#ae81ff', regexp: '#e6db74',
      type: '#66d9ef', fn: '#a6e22e', variable: '#f8f8f2', constant: '#ae81ff', punctuation: '#f8f8f2', tag: '#f92672', component: '#66d9ef', attr: '#a6e22e',
      cssProperty: '#66d9ef', cssSelector: '#a6e22e', lineNumber: '#90908a', lineNumberActive: '#c2c2bf', selection: '#878b9180', lineHighlight: '#3e3d32', cursor: '#f8f8f0', indentGuide: '#464741',
    },
  },
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    kind: 'dark',
    ui: { app: '#010409', sidebar: '#010409', editor: '#0d1117', elevated: '#161b22', tabs: '#010409', statusbar: '#0d1117', statusFg: '#7d8590', fg: '#e6edf3', muted: '#8b949e', accent: '#2f81f7', accentFg: '#ffffff' },
    syntax: {
      fg: '#e6edf3', comment: '#8b949e', keyword: '#ff7b72', control: '#ff7b72', string: '#a5d6ff', number: '#79c0ff', regexp: '#7ee787',
      type: '#ffa657', fn: '#d2a8ff', variable: '#ffa657', constant: '#79c0ff', punctuation: '#e6edf3', tag: '#7ee787', component: '#7ee787', attr: '#79c0ff',
      cssProperty: '#79c0ff', cssSelector: '#7ee787', lineNumber: '#6e7681', lineNumberActive: '#e6edf3', selection: '#264f78', lineHighlight: '#6e76811a', cursor: '#e6edf3', indentGuide: '#21262d',
    },
  },
  {
    id: 'github-light',
    label: 'GitHub Light',
    kind: 'light',
    ui: { app: '#f6f8fa', sidebar: '#f6f8fa', editor: '#ffffff', elevated: '#ffffff', tabs: '#f6f8fa', statusbar: '#f6f8fa', statusFg: '#57606a', fg: '#1f2328', muted: '#656d76', accent: '#0969da', accentFg: '#ffffff' },
    syntax: {
      fg: '#1f2328', comment: '#6e7781', keyword: '#cf222e', control: '#cf222e', string: '#0a3069', number: '#0550ae', regexp: '#116329',
      type: '#953800', fn: '#8250df', variable: '#953800', constant: '#0550ae', punctuation: '#1f2328', tag: '#116329', component: '#116329', attr: '#0550ae',
      cssProperty: '#0550ae', cssSelector: '#116329', lineNumber: '#8c959f', lineNumberActive: '#1f2328', selection: '#0969da33', lineHighlight: '#eaeef280', cursor: '#0969da', indentGuide: '#d0d7de',
    },
  },
  {
    id: 'night-owl',
    label: 'Night Owl',
    kind: 'dark',
    colorful: true,
    ui: { app: '#011627', sidebar: '#011627', editor: '#011627', elevated: '#0b2942', tabs: '#01111d', statusbar: '#011627', statusFg: '#5f7e97', fg: '#d6deeb', muted: '#89a4bb', accent: '#7e57c2', accentFg: '#ffffff' },
    syntax: {
      fg: '#d6deeb', comment: '#637777', keyword: '#c792ea', control: '#c792ea', string: '#ecc48d', number: '#f78c6c', regexp: '#5ca7e4',
      type: '#ffcb8b', fn: '#82aaff', variable: '#d6deeb', constant: '#82aaff', punctuation: '#7fdbca', tag: '#caece6', component: '#ffcb6b', attr: '#c5e478',
      cssProperty: '#80cbc4', cssSelector: '#c5e478', lineNumber: '#4b6479', lineNumberActive: '#c5e4fd', selection: '#1d3b53', lineHighlight: '#0b2942', cursor: '#80a4c2', indentGuide: '#5e81ce52',
    },
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    kind: 'dark',
    colorful: true,
    ui: { app: '#16161e', sidebar: '#16161e', editor: '#1a1b26', elevated: '#1f2335', tabs: '#16161e', statusbar: '#16161e', statusFg: '#787c99', fg: '#c0caf5', muted: '#8089b3', accent: '#7aa2f7', accentFg: '#16161e' },
    syntax: {
      fg: '#a9b1d6', comment: '#565f89', keyword: '#bb9af7', control: '#bb9af7', string: '#9ece6a', number: '#ff9e64', regexp: '#b4f9f8',
      type: '#2ac3de', fn: '#7aa2f7', variable: '#c0caf5', constant: '#ff9e64', punctuation: '#89ddff', tag: '#f7768e', component: '#2ac3de', attr: '#bb9af7',
      cssProperty: '#7dcfff', cssSelector: '#9ece6a', lineNumber: '#3b3f5c', lineNumberActive: '#737aa2', selection: '#515c7e4d', lineHighlight: '#1e202e', cursor: '#c0caf5', indentGuide: '#292e42',
    },
  },
  {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    kind: 'dark',
    colorful: true,
    ui: { app: '#11111b', sidebar: '#181825', editor: '#1e1e2e', elevated: '#313244', tabs: '#181825', statusbar: '#181825', statusFg: '#bac2de', fg: '#cdd6f4', muted: '#a6adc8', accent: '#cba6f7', accentFg: '#11111b' },
    syntax: {
      fg: '#cdd6f4', comment: '#7f849c', keyword: '#cba6f7', control: '#cba6f7', string: '#a6e3a1', number: '#fab387', regexp: '#f5c2e7',
      type: '#f9e2af', fn: '#89b4fa', variable: '#cdd6f4', constant: '#fab387', punctuation: '#94e2d5', tag: '#89b4fa', component: '#f9e2af', attr: '#f9e2af',
      cssProperty: '#89b4fa', cssSelector: '#f5c2e7', lineNumber: '#6c7086', lineNumberActive: '#b4befe', selection: '#585b7066', lineHighlight: '#313244aa', cursor: '#f5e0dc', indentGuide: '#313244',
    },
  },
  {
    id: 'synthwave',
    label: "SynthWave '84",
    kind: 'dark',
    colorful: true,
    ui: { app: '#171520', sidebar: '#1e1a2e', editor: '#262335', elevated: '#2a2139', tabs: '#1e1a2e', statusbar: '#ff7edb', statusFg: '#171520', fg: '#ffffff', muted: '#b6b1d4', accent: '#ff7edb', accentFg: '#171520' },
    syntax: {
      fg: '#ffffff', comment: '#848bbd', keyword: '#fede5d', control: '#fede5d', string: '#ff8b39', number: '#f97e72', regexp: '#f97e72',
      type: '#fe4450', fn: '#36f9f6', variable: '#ff7edb', constant: '#f97e72', punctuation: '#36f9f6', tag: '#72f1b8', component: '#fe4450', attr: '#fede5d',
      cssProperty: '#72f1b8', cssSelector: '#ff7edb', lineNumber: '#ffffff73', lineNumberActive: '#ffffffcc', selection: '#ffffff20', lineHighlight: '#ffffff0d', cursor: '#f97e72', indentGuide: '#444251',
    },
  },
  {
    id: 'shades-of-purple',
    label: 'Shades of Purple',
    kind: 'dark',
    colorful: true,
    ui: { app: '#1e1e3f', sidebar: '#222244', editor: '#2d2b55', elevated: '#28284e', tabs: '#222244', statusbar: '#1e1e3f', statusFg: '#a599e9', fg: '#ffffff', muted: '#a599e9', accent: '#fad000', accentFg: '#1e1e3f' },
    syntax: {
      fg: '#ffffff', comment: '#b362ff', keyword: '#ff9d00', control: '#ff9d00', string: '#a5ff90', number: '#ff628c', regexp: '#fb94ff',
      type: '#9effff', fn: '#fad000', variable: '#9effff', constant: '#ff628c', punctuation: '#e1efff', tag: '#9effff', component: '#fad000', attr: '#ffb454',
      cssProperty: '#9effff', cssSelector: '#fad000', lineNumber: '#a599e9', lineNumberActive: '#ffffff', selection: '#b362ff88', lineHighlight: '#1f1f41', cursor: '#fad000', indentGuide: '#a599e94d',
    },
  },
  {
    id: 'solarized-light',
    label: 'Solarized Light',
    kind: 'light',
    ui: { app: '#eee8d5', sidebar: '#eee8d5', editor: '#fdf6e3', elevated: '#fdf6e3', tabs: '#eee8d5', statusbar: '#eee8d5', statusFg: '#586e75', fg: '#073642', muted: '#657b83', accent: '#268bd2', accentFg: '#fdf6e3' },
    syntax: {
      fg: '#657b83', comment: '#93a1a1', keyword: '#859900', control: '#859900', string: '#2aa198', number: '#d33682', regexp: '#dc322f',
      type: '#b58900', fn: '#268bd2', variable: '#268bd2', constant: '#cb4b16', punctuation: '#93a1a1', tag: '#268bd2', component: '#b58900', attr: '#93a1a1',
      cssProperty: '#859900', cssSelector: '#268bd2', lineNumber: '#93a1a1', lineNumberActive: '#567983', selection: '#eee8d5', lineHighlight: '#eee8d5', cursor: '#657b83', indentGuide: '#93a1a180',
    },
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    kind: 'contrast',
    ui: { app: '#000000', sidebar: '#000000', editor: '#000000', elevated: '#0c0c0c', tabs: '#000000', statusbar: '#000000', statusFg: '#ffffff', fg: '#ffffff', muted: '#d0d0d0', accent: '#f38518', accentFg: '#000000' },
    syntax: {
      fg: '#ffffff', comment: '#7ca668', keyword: '#569cd6', control: '#c586c0', string: '#ce9178', number: '#b5cea8', regexp: '#d16969',
      type: '#4ec9b0', fn: '#dcdcaa', variable: '#9cdcfe', constant: '#4fc1ff', punctuation: '#ffffff', tag: '#569cd6', component: '#4ec9b0', attr: '#9cdcfe',
      cssProperty: '#9cdcfe', cssSelector: '#d7ba7d', lineNumber: '#ffffff', lineNumberActive: '#f38518', selection: '#ffffff40', lineHighlight: '#ffffff00', cursor: '#ffffff', indentGuide: '#ffffff40',
    },
  },
]

export const DEFAULT_THEME_ID = DARK_PLUS.id

const LEGACY_IDS: Record<string, string> = { dark: DARK_PLUS.id, light: 'light-plus', contrast: 'high-contrast' }

export function resolveThemeId(id: unknown) {
  if (typeof id !== 'string') return DEFAULT_THEME_ID
  const mapped = LEGACY_IDS[id] ?? id
  return THEMES.some((theme) => theme.id === mapped) ? mapped : DEFAULT_THEME_ID
}

export function themeById(id: string) {
  return THEMES.find((theme) => theme.id === id) ?? DARK_PLUS
}

function hexToRgb(hex: string) {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.slice(0, 6)
  const value = Number.parseInt(full, 16)
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`
}

export function applyThemeVariables(theme: ThemeDef, root: HTMLElement = document.documentElement) {
  const { ui, syntax } = theme
  const vars: Record<string, string> = {
    '--c-app': hexToRgb(ui.app),
    '--c-sidebar': hexToRgb(ui.sidebar),
    '--c-editor': hexToRgb(ui.editor),
    '--c-elevated': hexToRgb(ui.elevated),
    '--c-tabs': hexToRgb(ui.tabs),
    '--c-statusbar': hexToRgb(ui.statusbar),
    '--c-status-fg': hexToRgb(ui.statusFg),
    '--c-fg': hexToRgb(ui.fg),
    '--c-muted': hexToRgb(ui.muted),
    '--c-accent': hexToRgb(ui.accent),
    '--c-accent-fg': hexToRgb(ui.accentFg),
    '--syn-fg': syntax.fg,
    '--syn-tag': syntax.tag,
    '--syn-component': syntax.component,
    '--syn-attr': syntax.attr,
    '--syn-punctuation': syntax.punctuation,
    '--syn-fn': syntax.fn,
    '--syn-control': syntax.control,
    '--syn-variable': syntax.variable,
  }
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value)
  root.dataset.theme = theme.kind
  root.dataset.themeId = theme.id
  root.style.colorScheme = theme.kind === 'light' ? 'light' : 'dark'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ui.app)
}

const strip = (color: string) => color.replace('#', '')

export function monacoThemeData(theme: ThemeDef) {
  const s = theme.syntax
  const ui = theme.ui
  const rules = [
    { token: '', foreground: strip(s.fg) },
    { token: 'comment', foreground: strip(s.comment), fontStyle: 'italic' },
    { token: 'comment.doc', foreground: strip(s.comment), fontStyle: 'italic' },
    { token: 'keyword', foreground: strip(s.keyword) },
    { token: 'keyword.flow', foreground: strip(s.control) },
    { token: 'string', foreground: strip(s.string) },
    { token: 'string.escape', foreground: strip(s.constant) },
    { token: 'string.html', foreground: strip(s.string) },
    { token: 'number', foreground: strip(s.number) },
    { token: 'regexp', foreground: strip(s.regexp) },
    { token: 'type', foreground: strip(s.type) },
    { token: 'type.identifier', foreground: strip(s.type) },
    { token: 'identifier', foreground: strip(s.variable) },
    { token: 'delimiter', foreground: strip(s.fg) },
    { token: 'delimiter.bracket', foreground: strip(s.fg) },
    { token: 'operator', foreground: strip(s.fg) },
    { token: 'tag', foreground: strip(s.tag) },
    { token: 'tag.html', foreground: strip(s.tag) },
    { token: 'metatag', foreground: strip(s.keyword) },
    { token: 'metatag.content.html', foreground: strip(s.string) },
    { token: 'metatag.html', foreground: strip(s.keyword) },
    { token: 'delimiter.html', foreground: strip(s.punctuation) },
    { token: 'attribute.name', foreground: strip(s.attr) },
    { token: 'attribute.name.html', foreground: strip(s.attr) },
    { token: 'attribute.value', foreground: strip(s.string) },
    { token: 'attribute.value.html', foreground: strip(s.string) },
    { token: 'attribute.name.css', foreground: strip(s.cssProperty) },
    { token: 'attribute.value.css', foreground: strip(s.string) },
    { token: 'attribute.value.number.css', foreground: strip(s.number) },
    { token: 'attribute.value.unit.css', foreground: strip(s.number) },
    { token: 'attribute.value.hex.css', foreground: strip(s.constant) },
    { token: 'tag.css', foreground: strip(s.cssSelector) },
    { token: 'keyword.css', foreground: strip(s.control) },
    { token: 'delimiter.css', foreground: strip(s.fg) },
    { token: 'string.key.json', foreground: strip(s.variable) },
    { token: 'string.value.json', foreground: strip(s.string) },
  ]
  return {
    base: (theme.kind === 'light' ? 'vs' : theme.kind === 'contrast' ? 'hc-black' : 'vs-dark') as 'vs' | 'vs-dark' | 'hc-black',
    inherit: true,
    rules,
    colors: {
      'editor.background': ui.editor,
      'editor.foreground': s.fg,
      'editorLineNumber.foreground': s.lineNumber,
      'editorLineNumber.activeForeground': s.lineNumberActive,
      'editor.selectionBackground': s.selection,
      'editor.inactiveSelectionBackground': `${s.selection.slice(0, 7)}80`,
      'editor.lineHighlightBackground': s.lineHighlight,
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': s.cursor,
      'editorIndentGuide.background1': s.indentGuide,
      'editorIndentGuide.activeBackground1': s.lineNumberActive,
      'editorWidget.background': ui.elevated,
      'editorWidget.border': `${ui.fg}26`,
      'editorSuggestWidget.background': ui.elevated,
      'editorSuggestWidget.border': `${ui.fg}26`,
      'editorSuggestWidget.selectedBackground': `${ui.accent}40`,
      'editorHoverWidget.background': ui.elevated,
      'editorHoverWidget.border': `${ui.fg}26`,
      'editorStickyScroll.background': ui.editor,
      'scrollbarSlider.background': `${ui.muted}33`,
      'scrollbarSlider.hoverBackground': `${ui.muted}55`,
      'minimap.background': ui.editor,
      'editorBracketHighlight.foreground1': s.tag,
      'editorBracketHighlight.foreground2': s.control,
      'editorBracketHighlight.foreground3': s.fn,
      'editorBracketHighlight.foreground4': s.component,
      'editorBracketHighlight.foreground5': s.string,
      'editorBracketHighlight.foreground6': s.attr,
      'editorBracketHighlight.unexpectedBracket.foreground': '#f14c4c',
      'focusBorder': `${ui.accent}00`,
    },
  }
}
