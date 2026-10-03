import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronRight, ChevronsDownUp, Download, FilePlus, FileUp, Folder, FolderOpen, FolderPlus, FolderUp, Pencil, Trash2 } from 'lucide-react'
import { canRename, fileTree, folderChain, isDocFile, isValidFileName, isValidFolderName, parentFolders, type TreeNode } from '../lib/files'
import type { FileProblems } from '../types'
import { FileIcon } from './FileIcon'

type Props = {
  root: string
  paths: string[]
  folders: string[]
  active: string
  fileProblems: Record<string, FileProblems>
  onOpen: (path: string) => void
  onDelete: (path: string) => void
  onDeleteFolder: (path: string) => void
  onCreate: (folder?: string) => void
  onCreateFolder: (parent?: string) => void
  onRename: (path: string, kind: 'file' | 'folder') => void
  onUploadFiles: () => void
  onUploadFolder: () => void
  onDownloadFile: (path: string) => void
  onDownloadFolder: (path: string) => void
  creating: Creating | null
  folderNames: string[]
  onCreateSubmit: (path: string) => void
  onCreateCancel: () => void
}

type Creating = { kind: 'file' | 'folder'; parent: string }

type Actions = Omit<Props, 'root' | 'folders' | 'active' | 'onUploadFiles' | 'onUploadFolder'> & {
  active: string
  collapsed: Set<string>
  onToggle: (path: string) => void
}

const COLLAPSED_KEY = 'react-playground.collapsed'

function loadCollapsed() {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function saveCollapsed(collapsed: Set<string>) {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed]))
  } catch {
    // The tree still works for this session.
  }
}

export function Sidebar({ root, paths, folders, active, fileProblems, onOpen, onDelete, onDeleteFolder, onCreate, onCreateFolder, onRename, onUploadFiles, onUploadFolder, onDownloadFile, onDownloadFolder, creating, folderNames, onCreateSubmit, onCreateCancel }: Props) {
  const tree = fileTree(paths, folders)
  const [collapsed, setCollapsed] = useState(loadCollapsed)

  const update = (next: Set<string>) => {
    setCollapsed(next)
    saveCollapsed(next)
  }

  useEffect(() => {
    const parents = parentFolders(active)
    setCollapsed((current) => {
      if (!parents.some((folder) => current.has(folder))) return current
      const next = new Set(current)
      for (const folder of parents) next.delete(folder)
      saveCollapsed(next)
      return next
    })
  }, [active])

  useEffect(() => {
    if (!creating) return
    const open = ['::root', ...(creating.parent ? folderChain(creating.parent) : [])]
    setCollapsed((current) => {
      if (!open.some((folder) => current.has(folder))) return current
      const next = new Set(current)
      for (const folder of open) next.delete(folder)
      saveCollapsed(next)
      return next
    })
  }, [creating])

  const onToggle = (path: string) => {
    const next = new Set(collapsed)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    update(next)
  }

  const collapseAll = () => {
    const all = new Set<string>()
    const walk = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.kind === 'folder') {
          all.add(node.path)
          walk(node.children)
        }
      }
    }
    walk(tree)
    update(all)
  }

  const actions: Actions = { active, fileProblems, collapsed, onToggle, onOpen, onDelete, onDeleteFolder, onCreate, onCreateFolder, onRename, onDownloadFile, onDownloadFolder, paths, creating, folderNames, onCreateSubmit, onCreateCancel }

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex h-10 items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted/75">Explorer</span>
        <span className="flex items-center">
          <HeaderButton title="New file (Alt+N)" onClick={() => onCreate()} icon={<FilePlus size={15} />} />
          <HeaderButton title="New folder (Alt+Shift+N)" onClick={() => onCreateFolder()} icon={<FolderPlus size={15} />} />
          <HeaderButton title="Upload files" onClick={onUploadFiles} icon={<FileUp size={15} />} />
          <HeaderButton title="Upload folder" onClick={onUploadFolder} icon={<FolderUp size={15} />} />
          <HeaderButton title="Collapse folders" onClick={collapseAll} icon={<ChevronsDownUp size={15} />} />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto pb-4">
        <Section id="::root" label={root} collapsed={collapsed} onToggle={onToggle}>
          {creating?.parent === '' && <CreateRow creating={creating} depth={0} actions={actions} />}
          {tree.map((node) => (
            <NodeRow key={node.path} node={node} depth={0} actions={actions} />
          ))}
        </Section>
      </div>
    </div>
  )
}

function HeaderButton({ title, onClick, icon }: { title: string; onClick: () => void; icon: ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className="rounded-md p-1 text-muted hover:bg-fg/5 hover:text-fg">
      {icon}
    </button>
  )
}

function Section({ id, label, collapsed, onToggle, children }: { id: string; label: string; collapsed: Set<string>; onToggle: (id: string) => void; children: ReactNode }) {
  const open = !collapsed.has(id)
  return (
    <div className="mb-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/60 hover:text-fg"
      >
        <ChevronRight size={12} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        {label}
      </button>
      <Collapse open={open}>{children}</Collapse>
    </div>
  )
}

function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="tree-collapse" data-open={open} aria-hidden={!open}>
      <div {...(open ? {} : { inert: true })}>{children}</div>
    </div>
  )
}

function NodeRow({ node, depth, actions }: { node: TreeNode; depth: number; actions: Actions }) {
  if (node.kind === 'folder') {
    const open = !actions.collapsed.has(node.path)
    const FolderIcon = open ? FolderOpen : Folder
    return (
      <div>
        <div
          role="treeitem"
          aria-expanded={open}
          tabIndex={0}
          data-testid={`folder-${node.path}`}
          onClick={() => actions.onToggle(node.path)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              actions.onToggle(node.path)
            }
          }}
          onDoubleClick={(event) => event.preventDefault()}
          className="group flex cursor-pointer select-none items-center gap-1 py-1 pr-1 text-[13px] text-fg/80 outline-none hover:bg-fg/5 focus-visible:ring-1 focus-visible:ring-accent/60"
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <ChevronRight size={13} className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          <FolderIcon size={14} className="shrink-0 text-amber-400/90" />
          <span className={`min-w-0 flex-1 truncate ${tone(folderProblems(actions.fileProblems, node.path))}`}>{node.name}</span>
          {folderProblems(actions.fileProblems, node.path) && <span className={`mr-1 h-1.5 w-1.5 shrink-0 rounded-full ${folderProblems(actions.fileProblems, node.path)?.errors ? 'bg-rose-400' : 'bg-amber-300'}`} />}
          <span className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Icon action="New file in folder" onClick={() => actions.onCreate(node.path)} icon={<FilePlus size={12} />} />
            <Icon action="New folder" onClick={() => actions.onCreateFolder(node.path)} icon={<FolderPlus size={12} />} />
            <Icon action={`Download ${node.path}`} onClick={() => actions.onDownloadFolder(node.path)} icon={<Download size={12} />} />
            <Icon action={`Rename ${node.path}`} onClick={() => actions.onRename(node.path, 'folder')} icon={<Pencil size={12} />} />
            <Icon action={`Delete ${node.path}`} onClick={() => actions.onDeleteFolder(node.path)} icon={<Trash2 size={12} />} />
          </span>
        </div>
        <Collapse open={open}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 w-px bg-fg/10" style={{ left: 14 + depth * 12 }} />
            {actions.creating?.parent === node.path && <CreateRow creating={actions.creating} depth={depth + 1} actions={actions} />}
            {node.children.map((child) => (
              <NodeRow key={child.path} node={child} depth={depth + 1} actions={actions} />
            ))}
            {node.children.length === 0 && actions.creating?.parent !== node.path && (
              <p className="py-1 text-[11px] italic text-muted/60" style={{ paddingLeft: 30 + depth * 12 }}>Empty folder</p>
            )}
          </div>
        </Collapse>
      </div>
    )
  }
  return (
    <FileRow
      path={node.path}
      name={node.name}
      depth={depth}
      active={actions.active === node.path}
      problems={actions.fileProblems[node.path]}
      onOpen={actions.onOpen}
      onDelete={actions.onDelete}
      onDownload={actions.onDownloadFile}
      onRename={canRename(node.path) ? () => actions.onRename(node.path, 'file') : undefined}
    />
  )
}

function CreateRow({ creating, depth, actions }: { creating: Creating; depth: number; actions: Actions }) {
  const [name, setName] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  const clean = name.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  const path = creating.parent && clean ? `${creating.parent}/${clean}` : clean
  const file = creating.kind === 'file'
  const error = !clean
    ? ''
    : actions.paths.includes(path)
      ? `A file named ${clean} already exists here.`
      : actions.folderNames.includes(path)
        ? `A folder named ${clean} already exists here.`
        : file && !/\.[^./]+$/.test(clean)
          ? 'Add a file extension, like index.html, app.js, or Card.tsx.'
          : file && !isValidFileName(path)
            ? `${clean} is not a supported file name or type.`
            : !file && !isValidFolderName(path)
              ? 'Use letters, numbers, dots, dashes, and underscores.'
              : ''

  useEffect(() => {
    input.current?.focus()
    input.current?.scrollIntoView({ block: 'nearest' })
  }, [])

  const finish = (commit: boolean) => {
    if (done.current) return
    if (commit && clean && error) return
    done.current = true
    if (commit && clean) actions.onCreateSubmit(path)
    else actions.onCreateCancel()
  }

  return (
    <div>
    <div className="flex items-center gap-1 py-0.5 pr-2 text-[13px]" style={{ paddingLeft: (file ? 12 : 8) + depth * 12 }}>
      {file ? (
        <span className="grid w-5 shrink-0 place-items-center"><FileIcon path={/\.[^./]+$/.test(clean) ? clean : 'untitled.txt'} size={15} /></span>
      ) : (
        <>
          <ChevronRight size={13} className="shrink-0 text-muted" />
          <Folder size={14} className="shrink-0 text-amber-400/90" />
        </>
      )}
      <input
        ref={input}
        value={name}
        data-testid="explorer-create-input"
        aria-label={file ? 'New file name' : 'New folder name'}
        aria-invalid={Boolean(error)}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            finish(true)
          } else if (event.key === 'Escape') {
            event.preventDefault()
            finish(false)
          }
        }}
        onBlur={() => finish(!error)}
        className={`min-w-0 flex-1 border bg-editor px-1 py-0.5 font-[inherit] text-fg outline-none ${error ? 'border-rose-400' : 'border-accent'}`}
      />
    </div>
      {error && (
        <p role="alert" className="mr-2 border border-t-0 border-rose-400 bg-rose-950/95 px-2 py-1 text-[12px] leading-snug text-rose-100" style={{ marginLeft: (file ? 36 : 39) + depth * 12 }}>
          {error}
        </p>
      )}
    </div>
  )
}

function tone(problems?: FileProblems) {
  return problems?.errors ? 'text-rose-400' : problems?.warnings ? 'text-amber-300' : ''
}

function folderProblems(files: Record<string, FileProblems>, folder: string): FileProblems | undefined {
  let errors = 0
  let warnings = 0
  for (const [path, entry] of Object.entries(files)) {
    if (!path.startsWith(`${folder}/`)) continue
    errors += entry.errors
    warnings += entry.warnings
  }
  return errors || warnings ? { errors, warnings } : undefined
}

function FileRow({ path, name, depth, active, problems, onOpen, onDelete, onRename, onDownload }: { path: string; name: string; depth: number; active: boolean; problems?: FileProblems; onOpen: (path: string) => void; onDelete?: (path: string) => void; onRename?: () => void; onDownload: (path: string) => void }) {
  return (
    <div
      className={`group relative flex w-full items-center text-[13px] ${active ? 'bg-accent/15 text-fg' : 'text-fg/80 hover:bg-fg/5'}`}
      style={{ paddingLeft: 12 + depth * 12 }}
    >
      {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
      <button type="button" onClick={() => onOpen(path)} onDoubleClick={onRename} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
        <span className="grid w-5 shrink-0 place-items-center"><FileIcon path={path} size={15} /></span>
        <span className={`min-w-0 flex-1 truncate ${tone(problems)}`}>{name}</span>
        {problems && (
          <span data-testid={`problems-${path}`} title={`${problems.errors} errors, ${problems.warnings} warnings`} className={`shrink-0 pr-1 text-[11px] font-medium group-hover:hidden group-focus-within:hidden ${tone(problems)}`}>
            {problems.errors || problems.warnings}
          </span>
        )}
      </button>
      <span className="flex shrink-0 pr-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <Icon action={`Download ${path}`} onClick={() => onDownload(path)} icon={<Download size={12} />} />
        {onRename && <Icon action={`Rename ${path}`} onClick={onRename} icon={<Pencil size={12} />} />}
        {onDelete && !isDocFile(path) && <Icon action={`Delete ${path}`} onClick={() => onDelete(path)} icon={<Trash2 size={12} />} />}
      </span>
    </div>
  )
}

function Icon({ action, onClick, icon }: { action: string; onClick: () => void; icon: ReactNode }) {
  return (
    <button
      type="button"
      title={action}
      aria-label={action}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="rounded p-0.5 text-muted hover:bg-fg/10 hover:text-fg"
    >
      {icon}
    </button>
  )
}
