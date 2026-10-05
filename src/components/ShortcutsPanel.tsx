import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

export type Shortcut = {
  id: string
  group: 'General' | 'Files' | 'View' | 'Editor'
  label: string
  keys: string[]
  detail: string
}

export const SHORTCUTS: Shortcut[] = [
  { id: 'palette', group: 'General', label: 'Quick Open', keys: ['Ctrl', 'P'], detail: 'Open a file or run a command. Ctrl+Shift+P opens the same list.' },
  { id: 'shortcuts', group: 'General', label: 'Keyboard Shortcuts', keys: ['Ctrl', 'K', 'Ctrl', 'S'], detail: 'Show this list. Press Ctrl+K, then Ctrl+S.' },
  { id: 'themes', group: 'General', label: 'Color Theme', keys: ['Ctrl', 'K', 'Ctrl', 'T'], detail: 'Pick a theme with live preview. Press Ctrl+K, then Ctrl+T.' },
  { id: 'settings', group: 'General', label: 'Settings', keys: ['Ctrl', ','], detail: 'Theme, font, ligatures, and editor options.' },
  { id: 'save', group: 'General', label: 'Save', keys: ['Ctrl', 'S'], detail: 'Save every file to this browser. With Auto Save on this happens as you type; with Format On Save it formats first.' },
  { id: 'run', group: 'General', label: 'Run Preview', keys: ['Ctrl', 'Enter'], detail: 'Compile and refresh the preview now. In script and language workspaces it also executes the program — Python via Pyodide, C++/Java/C#/Go/Rust via the Wandbox runner — and shows the output in the preview window.' },
  { id: 'workspace', group: 'View', label: 'Switch Workspace', keys: ['Ctrl', 'K', 'W'], detail: 'Cycle through every workspace: HTML/CSS/JS, TypeScript, React, Python, C++, Java, C#, Go, and Rust. Each keeps its own files, preview, and console. Press Ctrl+K, then W.' },
  { id: 'header', group: 'View', label: 'Hide / Show Header', keys: ['Ctrl', 'K', 'H'], detail: 'Toggle the top header. Press Ctrl+K, then H. When hidden, a small Header button restores it.' },
  { id: 'new-file', group: 'Files', label: 'New File', keys: ['Alt', 'N'], detail: 'Type the name in the Explorer, like VS Code, inside the current file\'s folder (or the folder you clicked). Enter creates it, Esc cancels. Ctrl+N also works in the installed app (browsers reserve it in a tab).' },
  { id: 'new-folder', group: 'Files', label: 'New Folder', keys: ['Alt', 'Shift', 'N'], detail: 'Type the folder name in the Explorer. Enter creates it, Esc cancels; a/b creates nested folders. Ctrl+Shift+N also works in the installed app.' },
  { id: 'upload', group: 'Files', label: 'Upload Files', keys: ['Ctrl', 'O'], detail: 'Import files from your computer. You can also drag files or whole folders onto the window.' },
  { id: 'download', group: 'Files', label: 'Download Project', keys: ['Ctrl', 'Alt', 'S'], detail: 'Download a runnable Vite project as a .zip. Hover a file or folder in the Explorer to download just that.' },
  { id: 'rename', group: 'Files', label: 'Rename', keys: ['F2'], detail: 'Rename the active file when the cursor is outside the editor. In the editor, F2 renames a symbol.' },
  { id: 'close', group: 'Files', label: 'Close Editor', keys: ['Alt', 'W'], detail: 'Close the current tab. Pinned files (index.html and styles.css, plus script.js in HTML/CSS/JS or main.ts in TypeScript) stay open. Ctrl+W also works in the installed app.' },
  { id: 'search', group: 'View', label: 'Search Across Files', keys: ['Ctrl', 'Shift', 'F'], detail: 'Find and replace in every file, with match case, whole word, and regex.' },
  { id: 'explorer', group: 'View', label: 'Explorer', keys: ['Ctrl', 'Shift', 'E'], detail: 'Show the file tree.' },
  { id: 'outline', group: 'View', label: 'Outline', keys: ['Ctrl', 'Shift', 'U'], detail: 'Show components, hooks, functions, and types in the open file.' },
  { id: 'zen', group: 'View', label: 'Zen Mode', keys: ['Ctrl', 'K', 'Z'], detail: 'Hide everything except the editor and preview. Press Escape to leave.' },
  { id: 'files', group: 'View', label: 'Toggle Files', keys: ['Ctrl', 'B'], detail: 'Show or hide the file tree.' },
  { id: 'preview', group: 'View', label: 'Toggle Preview', keys: ['Ctrl', '\\'], detail: 'Show or hide the preview. Drag the splitter closed to do the same.' },
  { id: 'console', group: 'View', label: 'Toggle Panel', keys: ['Ctrl', 'J'], detail: 'Show or hide the bottom panel with Problems, Output, Debug Console, and Terminal.' },
  { id: 'terminal', group: 'View', label: 'Toggle Terminal', keys: ['Ctrl', '`'], detail: 'Open the panel on the Terminal tab, or hide it. In the terminal: Tab completes, ↑/↓ recall commands, Ctrl+C stops a script, Ctrl+L clears.' },
  { id: 'zoom-in', group: 'View', label: 'Editor Font Zoom In / Out', keys: ['Ctrl', '= / -'], detail: 'Make the editor text bigger or smaller. Ctrl+mouse wheel also works, and the status bar has A− / A+ buttons. With focus in the bottom panel, this zooms the panel instead.' },
  { id: 'zoom-reset', group: 'View', label: 'Reset Editor Font Size', keys: ['Ctrl', '0'], detail: 'Go back to the default editor font size. You can also set an exact size in Settings > Font Size.' },
  { id: 'format', group: 'Editor', label: 'Format Document', keys: ['Shift', 'Alt', 'F'], detail: 'Format the open file with Prettier. Works for HTML, CSS, JS, TS, JSX, and TSX. Style options are in Settings > Formatting.' },
  { id: 'find', group: 'Editor', label: 'Find', keys: ['Ctrl', 'F'], detail: 'Find in the open file.' },
  { id: 'replace', group: 'Editor', label: 'Replace', keys: ['Ctrl', 'H'], detail: 'Find and replace in the open file.' },
  { id: 'comment', group: 'Editor', label: 'Toggle Comment', keys: ['Ctrl', '/'], detail: 'Comment or uncomment the current line.' },
  { id: 'goto-line', group: 'Editor', label: 'Go to Line', keys: ['Ctrl', 'G'], detail: 'Jump to a line number.' },
  { id: 'goto-symbol', group: 'Editor', label: 'Go to Symbol', keys: ['Ctrl', 'Shift', 'O'], detail: 'Jump to a function, component, or type in the open file.' },
  { id: 'definition', group: 'Editor', label: 'Go to Definition', keys: ['F12'], detail: 'Jump to where a symbol is defined, even in another file. Ctrl+click does the same; Alt+F12 peeks it inline.' },
  { id: 'multi-cursor', group: 'Editor', label: 'Add Next Occurrence', keys: ['Ctrl', 'D'], detail: 'Select the next match and edit them together. Alt+Click adds a cursor.' },
  { id: 'move-line', group: 'Editor', label: 'Move Line', keys: ['Alt', '↑/↓'], detail: 'Move the line up or down. Shift+Alt+↑/↓ copies it.' },
  { id: 'emmet', group: 'Editor', label: 'Expand Emmet', keys: ['Tab / Enter'], detail: 'Expand abbreviations like h2, ul>li*3, or div.card>h2+p in HTML, JSX, TSX, and CSS. Enter accepts the highlighted Emmet suggestion; Tab expands without the list.' },
  { id: 'suggest', group: 'Editor', label: 'Trigger Suggest', keys: ['Ctrl', 'Space'], detail: 'Open completions for components, imports, and Tailwind classes. Enter or Tab inserts the highlighted suggestion in every language, including plain JavaScript; Esc closes the list.' },
]

export function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<'All' | Shortcut['group']>('All')
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SHORTCUTS.filter((row) => (group === 'All' || row.group === group) && (!q || `${row.label} ${row.detail} ${row.keys.join(' ')}`.toLowerCase().includes(q)))
  }, [group, query])

  return (
    <div className="absolute inset-0 z-30 flex bg-editor text-fg" data-testid="shortcuts-panel">
      <aside className="hidden w-52 shrink-0 border-r border-fg/10 p-3 sm:block">
        <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.16em] text-muted/75">Shortcuts</p>
        {(['All', 'General', 'Files', 'View', 'Editor'] as const).map((item) => (
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
            placeholder="Search shortcuts"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/55"
          />
          <button type="button" title="Close shortcuts" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-fg/5 hover:text-fg">
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-2">
          {rows.map((row) => (
            <div key={row.id} className="grid items-center gap-3 border-b border-fg/5 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted/75">{row.group}</p>
                <p className="text-sm text-fg">{row.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{row.detail}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {row.keys.map((key, index) => (
                  <kbd key={`${row.id}-${key}-${index}`} className="rounded-md border border-fg/10 bg-fg/5 px-1.5 py-0.5 font-mono text-[11px] text-fg">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="py-10 text-center text-sm text-muted/75">No shortcuts match that search.</p>}
        </div>
      </div>
    </div>
  )
}
