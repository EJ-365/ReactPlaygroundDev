import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { installStore } from '../lib/install'
import type { SideView } from './ActivityBar'
import { canRename, isValidFileName, isValidFolderName, normalizeFileName, normalizeFolderName } from '../lib/files'

export type PaletteCommand = { id: string; label: string; hint?: string; run: () => void }

export function RenameDialog({
  path,
  kind,
  existingFiles,
  existingFolders,
  onCancel,
  onRename,
}: {
  path: string
  kind: 'file' | 'folder'
  existingFiles: string[]
  existingFolders: string[]
  onCancel: () => void
  onRename: (next: string) => void
}) {
  const [name, setName] = useState(path)
  const input = useRef<HTMLInputElement>(null)
  const normalized = kind === 'folder' ? normalizeFolderName(name) : normalizeFileName(name)
  const taken = kind === 'folder'
    ? existingFolders.includes(normalized) || existingFiles.some((file) => file === normalized || file.startsWith(`${normalized}/`))
    : existingFiles.includes(normalized)
  const invalid = kind === 'folder' ? !isValidFolderName(normalized) : !isValidFileName(normalized) || !canRename(normalized)
  const unchanged = normalized === path
  const error = !normalized
    ? 'Enter a name'
    : unchanged
      ? ''
      : invalid
        ? kind === 'folder'
          ? 'Use a folder name like components or features/auth'
          : 'Use a name like Button.tsx, about.html, or data/items.json'
        : taken
          ? 'That name is already in use'
          : ''

  useEffect(() => {
    input.current?.focus()
    const value = input.current?.value ?? path
    const dot = value.lastIndexOf('.')
    const slash = value.lastIndexOf('/')
    const start = slash + 1
    const end = kind === 'file' && dot > slash ? dot : value.length
    input.current?.setSelectionRange(start, end)
  }, [kind, path])

  return (
    <Modal title={kind === 'folder' ? 'Rename folder' : 'Rename file'} onClose={onCancel}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!error && !unchanged) onRename(normalized)
        }}
      >
        <input
          ref={input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-fg/10 bg-fg/5 px-3 py-2 font-mono text-sm outline-none ring-accent/40 focus:ring-2"
          spellCheck={false}
        />
        <p className="mt-3 min-h-5 text-xs text-rose-300">{error}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-sm text-fg/80 hover:bg-fg/5">Cancel</button>
          <button type="submit" disabled={Boolean(error) || unchanged} className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg disabled:opacity-40">Rename</button>
        </div>
      </form>
    </Modal>
  )
}

export function DeleteFolderDialog({ path, count, onCancel, onDelete }: { path: string; count: number; onCancel: () => void; onDelete: () => void }) {
  return (
    <Modal title={`Delete ${path}?`} onClose={onCancel}>
      <p className="text-sm leading-6 text-fg/80">
        {count === 0 ? 'This folder is empty.' : `This also deletes ${count} ${count === 1 ? 'file' : 'files'} inside ${path}.`}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-sm text-fg/80 hover:bg-fg/5">Cancel</button>
        <button type="button" onClick={onDelete} className="rounded-full bg-rose-400 px-3 py-1.5 text-sm font-semibold text-[#2a0d14]">Delete</button>
      </div>
    </Modal>
  )
}

export function ResetDialog({ onCancel, onReset }: { onCancel: () => void; onReset: () => void }) {
  return (
    <Modal title="Reset project?" onClose={onCancel}>
      <p className="text-sm leading-6 text-fg/80">This replaces every file with the starter React and Tailwind project.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-sm text-fg/80 hover:bg-fg/5">Cancel</button>
        <button type="button" onClick={onReset} className="rounded-full bg-rose-400 px-3 py-1.5 text-sm font-semibold text-[#2a0d14]">Reset</button>
      </div>
    </Modal>
  )
}

export function CommandPalette({ files, initialQuery, onZen, onView, onClose, onOpen, onRun, onReset, onConsole, onPreview, onSidebar, onClear, onNew, onFolder, onRename, onSettings, onShortcuts, onThemes, onInstall, onShare, onDownload, onPopout, onFormat, extra = [] }: {
  files: string[]
  initialQuery?: string
  onZen: () => void
  onView: (view: SideView) => void
  onClose: () => void
  onOpen: (path: string) => void
  onRun: () => void
  onReset: () => void
  onConsole: () => void
  onPreview: () => void
  onSidebar: () => void
  onClear: () => void
  onNew: () => void
  onFolder: () => void
  onRename: () => void
  onSettings: () => void
  onShortcuts: () => void
  onThemes: () => void
  onInstall: () => void
  onShare: () => void
  onDownload: () => void
  onPopout: () => void
  onFormat: () => void
  extra?: PaletteCommand[]
}) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [index, setIndex] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const items = useMemo(() => {
    const commands: PaletteCommand[] = [
      { id: 'run', label: 'Run preview', hint: 'Ctrl+Enter', run: onRun },
      { id: 'new', label: 'New file', hint: 'Alt+N', run: onNew },
      { id: 'folder', label: 'New folder', hint: 'Alt+Shift+N', run: onFolder },
      { id: 'rename', label: 'Rename file', hint: 'F2', run: onRename },
      { id: 'format', label: 'Format document (Prettier)', hint: 'Shift+Alt+F', run: onFormat },
      { id: 'console', label: 'View: Toggle Panel', hint: 'Ctrl+J', run: onConsole },
      { id: 'preview', label: 'Toggle preview', hint: 'Ctrl+\\', run: onPreview },
      { id: 'popout', label: 'Open preview in a new window', run: onPopout },
      { id: 'download', label: 'Download project as a Vite app (.zip)', hint: 'Ctrl+Alt+S', run: onDownload },
      { id: 'share', label: 'Copy share link', run: onShare },
      { id: 'settings', label: 'Open settings', hint: 'Ctrl+,', run: onSettings },
      { id: 'shortcuts', label: 'Keyboard shortcuts', hint: 'Ctrl+K Ctrl+S', run: onShortcuts },
      { id: 'themes', label: 'Preferences: Color Theme', hint: 'Ctrl+K Ctrl+T', run: onThemes },
      ...(installStore.get() === 'available' ? [{ id: 'install', label: 'Install app on this device', run: onInstall }] : []),
      { id: 'sidebar', label: 'Toggle files', hint: 'Ctrl+B', run: onSidebar },
      { id: 'search', label: 'Search: Find in Files', hint: 'Ctrl+Shift+F', run: () => onView('search') },
      { id: 'explorer', label: 'View: Show Explorer', hint: 'Ctrl+Shift+E', run: () => onView('explorer') },
      { id: 'outline', label: 'View: Show Outline', hint: 'Ctrl+Shift+U', run: () => onView('outline') },
      { id: 'zen', label: 'View: Toggle Zen Mode', hint: 'Ctrl+K Z', run: onZen },
      { id: 'clear', label: 'Clear Output and Debug Console', run: onClear },
      { id: 'reset', label: 'Reset project', run: onReset },
      ...extra,
    ]
    const fileItems = files.map((file) => ({ id: file, label: file, hint: 'File', run: () => onOpen(file) }))
    const commandMode = query.startsWith('>')
    const all = commandMode ? commands : [...fileItems, ...commands]
    const q = (commandMode ? query.slice(1) : query).trim().toLowerCase()
    return q ? all.filter((item) => item.label.toLowerCase().includes(q)) : all
  }, [extra, files, onView, onZen, onThemes, onInstall, onShare, onClear, onConsole, onDownload, onFolder, onFormat, onNew, onOpen, onPopout, onPreview, onRename, onReset, onRun, onSettings, onShortcuts, onSidebar, query])

  useEffect(() => input.current?.focus(), [])
  useEffect(() => setIndex(0), [query])

  return (
    <Modal title="Quick open" onClose={onClose}>
      <input
        ref={input}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search files, or type > for commands"
        className="w-full rounded-xl border border-fg/10 bg-fg/5 px-3 py-2 text-sm outline-none ring-accent/40 focus:ring-2"
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setIndex((current) => Math.min(items.length - 1, current + 1))
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setIndex((current) => Math.max(0, current - 1))
          }
          if (event.key === 'Enter' && items[index]) {
            event.preventDefault()
            items[index].run()
            onClose()
          }
        }}
      />
      <div className="mt-2 max-h-72 overflow-auto">
        {items.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            onMouseEnter={() => setIndex(itemIndex)}
            onClick={() => {
              item.run()
              onClose()
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${itemIndex === index ? 'bg-fg/10 text-fg' : 'text-fg/80'}`}
          >
            <span className="truncate">{item.label}</span>
            {item.hint && <span className="ml-3 text-[10px] uppercase tracking-wide text-muted/75">{item.hint}</span>}
          </button>
        ))}
        {items.length === 0 && <p className="px-2 py-4 text-sm text-muted/75">No matches</p>}
      </div>
    </Modal>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-fg/10 bg-elevated p-4 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <button type="button" onClick={onClose} className="text-xs text-muted hover:text-fg">Esc</button>
        </div>
        {children}
      </div>
    </div>
  )
}
