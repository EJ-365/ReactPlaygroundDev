import { useMemo, useState } from 'react'
import { Check, RotateCcw, Search, X } from 'lucide-react'
import { settingsStore, type FontChoice, type LineNumbers, type Settings } from '../lib/settings'
import { THEMES, type ThemeDef } from '../lib/themes'

type SettingRow = {
  id: keyof Settings
  group: 'Workbench' | 'Files' | 'Formatting' | 'Editor' | 'Tags'
  label: string
  description: string
  keywords: string
  control: 'theme' | 'font' | 'size' | 'panelSize' | 'tabs' | 'wrap' | 'lines' | 'cursor' | 'whitespace' | 'brackets' | 'width' | 'suggest' | 'toggle'
}

const ROWS: SettingRow[] = [
  { id: 'theme', group: 'Workbench', label: 'Color Theme', description: 'VS Code-style themes for the editor and the whole workbench. Press Ctrl+K Ctrl+T to switch quickly.', keywords: 'theme color appearance dark light dracula monokai one dark github night owl tokyo synthwave catppuccin solarized purple colorful', control: 'theme' },
  { id: 'jsxHighlighting', group: 'Workbench', label: 'Rich JSX Highlighting', description: 'Color JSX tags, components, attributes, function calls, and control keywords like VS Code does.', keywords: 'jsx tsx tag color highlight semantic function', control: 'toggle' },
  { id: 'showHeader', group: 'Workbench', label: 'Show Top Header', description: 'Show the title bar with Run, Format, Share, and Download. Hide it for more editor space; press Ctrl+K H or the floating button to bring it back.', keywords: 'header title bar top hide show toolbar', control: 'toggle' },
  { id: 'autoSave', group: 'Files', label: 'Auto Save', description: 'Save every change to this browser automatically. When off, unsaved tabs show a dot and Ctrl+S saves.', keywords: 'auto save autosave persist storage dirty', control: 'toggle' },
  { id: 'formatOnSave', group: 'Formatting', label: 'Format On Save', description: 'Format the open file with Prettier when you press Ctrl+S.', keywords: 'format save prettier ctrl s', control: 'toggle' },
  { id: 'formatSemicolons', group: 'Formatting', label: 'Semicolons', description: 'Add semicolons at the end of statements when formatting JS and TS.', keywords: 'prettier semicolon semi format', control: 'toggle' },
  { id: 'formatSingleQuote', group: 'Formatting', label: 'Single Quotes', description: "Use 'single' instead of \"double\" quotes when formatting JS and TS. JSX attributes keep double quotes.", keywords: 'prettier quotes single double format', control: 'toggle' },
  { id: 'formatPrintWidth', group: 'Formatting', label: 'Print Width', description: 'The line length Prettier tries to wrap code at.', keywords: 'prettier print width line length wrap format', control: 'width' },
  { id: 'autoCloseTags', group: 'Tags', label: 'Auto Close Tags', description: 'Type <div> and the matching </div> is added after the cursor. Works in JSX, TSX, and HTML.', keywords: 'tag close auto closing jsx html', control: 'toggle' },
  { id: 'renameTags', group: 'Tags', label: 'Auto Rename Tag', description: 'Rename an opening tag and its matching closing tag changes with it (and the other way round). Works in JSX, TSX, and HTML.', keywords: 'rename tag linked editing mirror pair jsx html', control: 'toggle' },
  { id: 'selfClosingTags', group: 'Tags', label: 'Self-Closing Tags', description: 'Type / inside a tag to finish it as />. In JSX, void elements such as <img> and <br> become <img />.', keywords: 'self closing tag slash void img br input jsx', control: 'toggle' },
  { id: 'fontSize', group: 'Editor', label: 'Font Size', description: 'Controls the editor font size in pixels. Ctrl+= and Ctrl+- zoom, Ctrl+0 resets, and the A− / A+ buttons in the status bar do the same.', keywords: 'font size zoom', control: 'size' },
  { id: 'panelFontSize', group: 'Editor', label: 'Panel Font Size', description: 'Font size of the Output, Debug Console, and Terminal. Use the − / + buttons in the panel header, or Ctrl+= / Ctrl+- / Ctrl+0 while the panel has focus.', keywords: 'font size zoom terminal console output debug panel', control: 'panelSize' },
  { id: 'fontFamily', group: 'Editor', label: 'Font Family', description: 'JetBrains Mono, Fira Code, Cascadia Code, or the system monospace font.', keywords: 'font family ligatures cascadia fira', control: 'font' },
  { id: 'jsSuggestions', group: 'Editor', label: 'JavaScript Suggestions', description: 'When the suggestion list opens in JS, TS, JSX, and TSX code. Ctrl+Space always opens it. Tailwind classes and other strings keep suggesting as you type.', keywords: 'autocomplete intellisense suggestions javascript typescript quick suggest popup', control: 'suggest' },
  { id: 'jsAcceptSuggestions', group: 'Editor', label: 'Fill In JavaScript Suggestions', description: 'Enter or Tab always inserts the highlighted suggestion. Off: nothing is filled in while you type: no faint ghost-text preview, and punctuation like ( or . never accepts a suggestion. On: punctuation and inline previews fill in the selected suggestion too, like VS Code.', keywords: 'autocomplete accept enter tab commit character preview ghost inline javascript typescript', control: 'toggle' },
  { id: 'emmet', group: 'Editor', label: 'Emmet', description: 'Expand abbreviations like div.card>h2+p or ul>li*3 with Tab in JSX, TSX, HTML, and CSS.', keywords: 'emmet abbreviation expand html jsx css', control: 'toggle' },
  { id: 'reactSnippets', group: 'Editor', label: 'React Snippets', description: 'Suggest rfc, rafce, us (useState), ue (useEffect), ur, um, ucb, jmap, clg, and more.', keywords: 'snippet react rfc rafce usestate useeffect', control: 'toggle' },
  { id: 'inlayHints', group: 'Editor', label: 'Inlay Hints', description: 'Show function return types inline in .ts and .tsx files, such as : Element after a component. Never shown in .js or .jsx files, and parameter names are never shown.', keywords: 'inlay hints return type typescript', control: 'toggle' },
  { id: 'fontLigatures', group: 'Editor', label: 'Font Ligatures', description: 'Render sequences such as =>, !==, and >= as single glyphs. Cascadia Code and Fira Code include a full ligature set.', keywords: 'ligature font calt liga cascadia fira', control: 'toggle' },
  { id: 'tabSize', group: 'Editor', label: 'Tab Size', description: 'The number of spaces a tab is equal to.', keywords: 'tab indent spaces', control: 'tabs' },
  { id: 'wordWrap', group: 'Editor', label: 'Word Wrap', description: 'Controls how lines wrap in the editor.', keywords: 'wrap', control: 'wrap' },
  { id: 'minimap', group: 'Editor', label: 'Minimap', description: 'Shows a preview of the file along the right edge.', keywords: 'minimap overview', control: 'toggle' },
  { id: 'lineNumbers', group: 'Editor', label: 'Line Numbers', description: 'Show, hide, or use relative line numbers.', keywords: 'line numbers gutter', control: 'lines' },
  { id: 'cursorStyle', group: 'Editor', label: 'Cursor Style', description: 'Line, block, or underline.', keywords: 'cursor caret', control: 'cursor' },
  { id: 'renderWhitespace', group: 'Editor', label: 'Render Whitespace', description: 'Show spaces and tabs in the editor.', keywords: 'whitespace spaces tabs', control: 'whitespace' },
  { id: 'formatOnPaste', group: 'Editor', label: 'Format On Paste', description: 'Format the pasted text with the language formatter.', keywords: 'format paste', control: 'toggle' },
  { id: 'autoClosingBrackets', group: 'Editor', label: 'Auto Closing Brackets', description: 'Insert a closing bracket when you type an opening one.', keywords: 'brackets quotes pairs', control: 'brackets' },
  { id: 'bracketPairs', group: 'Editor', label: 'Bracket Pair Colorization', description: 'Color matching brackets and show guides.', keywords: 'bracket pairs guides', control: 'toggle' },
  { id: 'stickyScroll', group: 'Editor', label: 'Sticky Scroll', description: 'Keep the current scope pinned at the top of the editor.', keywords: 'sticky scroll scope', control: 'toggle' },
  { id: 'smoothScrolling', group: 'Editor', label: 'Smooth Scrolling', description: 'Animate editor scrolling.', keywords: 'smooth scroll', control: 'toggle' },
  { id: 'mouseWheelZoom', group: 'Editor', label: 'Mouse Wheel Zoom', description: 'Zoom the editor font with Ctrl and the mouse wheel.', keywords: 'zoom wheel font', control: 'toggle' },
]

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [settings, setSettings] = useState(settingsStore.get)
  const [group, setGroup] = useState<'All' | SettingRow['group']>('All')

  const patch = (next: Partial<Settings>) => {
    settingsStore.update(next)
    setSettings(settingsStore.get())
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ROWS.filter((row) => (group === 'All' || row.group === group) && (!q || `${row.label} ${row.description} ${row.keywords}`.toLowerCase().includes(q)))
  }, [group, query])

  return (
    <div className="absolute inset-0 z-30 flex bg-editor text-fg" data-testid="settings-panel">
      <aside className="hidden w-52 shrink-0 border-r border-fg/10 p-3 sm:block">
        <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.16em] text-muted/75">Settings</p>
        {(['All', 'Workbench', 'Files', 'Formatting', 'Editor', 'Tags'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setGroup(item)}
            className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${group === item ? 'bg-fg/10 text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg'}`}
          >
            {item}
          </button>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-fg/10 px-4 py-3">
          <Search size={15} className="text-muted/75" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search settings"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/55"
          />
          <button type="button" title="Reset settings" onClick={() => { settingsStore.reset(); setSettings(settingsStore.get()) }} className="rounded-md p-1.5 text-muted hover:bg-fg/5 hover:text-fg">
            <RotateCcw size={14} />
          </button>
          <button type="button" title="Close settings" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-fg/5 hover:text-fg">
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          {rows.map((row) => (
            <div key={row.id} className={`grid gap-3 border-b border-fg/5 py-4 ${row.control === 'theme' ? '' : 'sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center'}`}>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted/75">{row.group}</p>
                <p className="text-sm text-fg">{row.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{row.description}</p>
              </div>
              <Control row={row} settings={settings} onChange={patch} />
            </div>
          ))}
          {rows.length === 0 && <p className="py-10 text-center text-sm text-muted/75">No settings match that search.</p>}
        </div>
      </div>
    </div>
  )
}

function Control({ row, settings, onChange }: { row: SettingRow; settings: Settings; onChange: (patch: Partial<Settings>) => void }) {
  const selectClass = 'w-full rounded-lg border border-fg/10 bg-fg/5 px-2 py-1.5 text-sm outline-none'
  if (row.control === 'theme') {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" role="radiogroup" aria-label="Color theme">
        {THEMES.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} selected={settings.theme === theme.id} onSelect={() => onChange({ theme: theme.id })} />
        ))}
      </div>
    )
  }
  if (row.control === 'font') {
    return (
      <select className={selectClass} value={settings.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value as FontChoice })}>
        <option value="jetbrains">JetBrains Mono</option>
        <option value="cascadia">Cascadia Code</option>
        <option value="fira">Fira Code</option>
        <option value="system">System mono</option>
      </select>
    )
  }
  if (row.control === 'size') {
    return (
      <label className="flex items-center gap-3 text-sm">
        <input type="range" min={10} max={28} value={settings.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} className="w-full accent-accent" />
        <span className="w-8 font-mono text-fg/80">{settings.fontSize}</span>
      </label>
    )
  }
  if (row.control === 'panelSize') {
    return (
      <label className="flex items-center gap-3 text-sm">
        <input type="range" min={10} max={24} value={settings.panelFontSize} onChange={(event) => onChange({ panelFontSize: Number(event.target.value) })} className="w-full accent-accent" />
        <span className="w-8 font-mono text-fg/80">{settings.panelFontSize}</span>
      </label>
    )
  }
  if (row.control === 'width') {
    return (
      <select className={selectClass} value={settings.formatPrintWidth} onChange={(event) => onChange({ formatPrintWidth: Number(event.target.value) as 80 | 100 | 120 })}>
        <option value={80}>80 characters</option>
        <option value={100}>100 characters</option>
        <option value={120}>120 characters</option>
      </select>
    )
  }
  if (row.control === 'tabs') {
    return (
      <select className={selectClass} value={settings.tabSize} onChange={(event) => onChange({ tabSize: Number(event.target.value) as 2 | 4 })}>
        <option value={2}>2 spaces</option>
        <option value={4}>4 spaces</option>
      </select>
    )
  }
  if (row.control === 'suggest') {
    return (
      <select className={selectClass} value={settings.jsSuggestions} onChange={(event) => onChange({ jsSuggestions: event.target.value as 'typing' | 'manual' })}>
        <option value="typing">While typing</option>
        <option value="manual">Only with Ctrl+Space</option>
      </select>
    )
  }
  if (row.control === 'wrap') {
    return (
      <select className={selectClass} value={settings.wordWrap} onChange={(event) => onChange({ wordWrap: event.target.value as 'off' | 'on' })}>
        <option value="off">off</option>
        <option value="on">on</option>
      </select>
    )
  }
  if (row.control === 'lines') {
    return (
      <select className={selectClass} value={settings.lineNumbers} onChange={(event) => onChange({ lineNumbers: event.target.value as LineNumbers })}>
        <option value="on">on</option>
        <option value="relative">relative</option>
        <option value="off">off</option>
      </select>
    )
  }
  if (row.control === 'cursor') {
    return (
      <select className={selectClass} value={settings.cursorStyle} onChange={(event) => onChange({ cursorStyle: event.target.value as Settings['cursorStyle'] })}>
        <option value="line">line</option>
        <option value="block">block</option>
        <option value="underline">underline</option>
      </select>
    )
  }
  if (row.control === 'whitespace') {
    return (
      <select className={selectClass} value={settings.renderWhitespace} onChange={(event) => onChange({ renderWhitespace: event.target.value as Settings['renderWhitespace'] })}>
        <option value="selection">selection</option>
        <option value="all">all</option>
        <option value="none">none</option>
      </select>
    )
  }
  if (row.control === 'brackets') {
    return (
      <select className={selectClass} value={settings.autoClosingBrackets} onChange={(event) => onChange({ autoClosingBrackets: event.target.value as Settings['autoClosingBrackets'] })}>
        <option value="always">always</option>
        <option value="languageDefined">language defined</option>
        <option value="never">never</option>
      </select>
    )
  }
  const checked = Boolean(settings[row.id])
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange({ [row.id]: !checked } as Partial<Settings>)}
      className={`relative h-6 w-11 rounded-full ${checked ? 'bg-accent' : 'bg-fg/15'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function ThemeCard({ theme, selected, onSelect }: { theme: ThemeDef; selected: boolean; onSelect: () => void }) {
  const { ui, syntax } = theme
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-testid={`theme-${theme.id}`}
      onClick={onSelect}
      className={`group overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 hover:shadow-lg ${selected ? 'border-accent ring-2 ring-accent/40' : 'border-fg/10'}`}
    >
      <div className="flex h-20" style={{ background: ui.editor }}>
        <div className="w-5 shrink-0" style={{ background: ui.sidebar }} />
        <div className="min-w-0 flex-1 px-2 py-2 font-mono text-[9px] leading-[13px]">
          <div><span style={{ color: syntax.control }}>return</span> <span style={{ color: syntax.punctuation }}>(</span></div>
          <div className="pl-2">
            <span style={{ color: syntax.punctuation }}>&lt;</span><span style={{ color: syntax.tag }}>div</span> <span style={{ color: syntax.attr }}>className</span><span style={{ color: syntax.fg }}>=</span><span style={{ color: syntax.string }}>"card"</span><span style={{ color: syntax.punctuation }}>&gt;</span>
          </div>
          <div className="pl-4">
            <span style={{ color: syntax.punctuation }}>&lt;</span><span style={{ color: syntax.component }}>Counter</span> <span style={{ color: syntax.attr }}>step</span><span style={{ color: syntax.fg }}>=</span><span style={{ color: syntax.punctuation }}>{'{'}</span><span style={{ color: syntax.number }}>2</span><span style={{ color: syntax.punctuation }}>{'}'}</span> <span style={{ color: syntax.punctuation }}>/&gt;</span>
          </div>
          <div className="pl-2"><span style={{ color: syntax.fn }}>useState</span><span style={{ color: syntax.fg }}>(</span><span style={{ color: syntax.keyword }}>true</span><span style={{ color: syntax.fg }}>)</span></div>
        </div>
      </div>
      <div className="h-1" style={{ background: ui.statusbar === ui.app ? ui.accent : ui.statusbar }} />
      <div className="flex items-center gap-2 bg-fg/[0.03] px-2.5 py-2">
        <span className="min-w-0 flex-1 truncate text-xs text-fg">{theme.label}</span>
        {theme.colorful && <span className="rounded-full bg-gradient-to-r from-pink-500 via-amber-400 to-cyan-400 px-1.5 text-[9px] font-semibold text-black">Colorful</span>}
        {selected && <Check size={13} className="shrink-0 text-accent" />}
      </div>
    </button>
  )
}
