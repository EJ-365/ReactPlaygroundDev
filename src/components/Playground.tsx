import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { ChevronsDown, Code, Eye, Minimize2, Terminal, Upload } from 'lucide-react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useProject } from '../hooks/useProject'
import { canRename, isImageFile, isSvgFile, parentFolders, uniqueFolders } from '../lib/files'
import { downloadFile, downloadFiles, downloadProject, downloadWebProject } from '../lib/download'
import { openExternalPreview, syncExternalPreview } from '../lib/previewWindow'
import { installStore } from '../lib/install'
import { copyText, createShareUrl } from '../lib/share'
import { DEFAULT_SETTINGS, settingsStore } from '../lib/settings'
import { statusStore } from '../lib/statusStore'
import { saveProject } from '../lib/storage'
import { TEMPLATES, type Template } from '../lib/templates'
import { fromDataTransfer, fromFileList, type UploadResult } from '../lib/upload'
import { WORKSPACE_IDS, WORKSPACES, workspaceStore, type WorkspaceId } from '../lib/workspace'
import type { FileProblems, MobilePane } from '../types'
import { ActivityBar, type SideView } from './ActivityBar'
import { Breadcrumbs } from './Breadcrumbs'
import { CodeEditor } from './CodeEditor'
import { ConsolePanel } from './ConsolePanel'
import { ImageView } from './ImageView'
import { CommandPalette, DeleteFolderDialog, RenameDialog, ResetDialog, type PaletteCommand } from './Overlays'
import { OutlineView } from './OutlineView'
import { PreviewPane } from './PreviewPane'
import { SearchView } from './SearchView'
import { Sidebar } from './Sidebar'
import { SettingsPanel } from './SettingsPanel'
import { ShortcutsPanel } from './ShortcutsPanel'
import { StatusBar } from './StatusBar'
import { TabBar } from './TabBar'
import { ThemePicker } from './ThemePicker'
import { TemplatePicker } from './TemplatePicker'
import { TitleBar } from './TitleBar'
import { Walkthrough, walkthroughDone } from './Walkthrough'

export function Playground({ suspended = false }: { suspended?: boolean }) {
  const project = useProject()
  const showHeader = useSyncExternalStore(settingsStore.subscribe, () => settingsStore.get().showHeader)
  const [tour, setTour] = useState(() => !walkthroughDone())
  const [templates, setTemplates] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragDepth = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const suspendedRef = useRef(suspended)
  suspendedRef.current = suspended
  const desktop = useMediaQuery('(min-width: 1080px)')
  const [panel, setPanel] = useState<null | 'settings' | 'shortcuts' | 'themes'>(null)
  const uploadRef = useRef<{ files: () => void; download: () => void; save: () => void }>({ files() {}, download() {}, save() {} })
  const [view, setView] = useState<SideView>('explorer')
  const [searchFocus, setSearchFocus] = useState(0)
  const [zen, setZen] = useState(false)
  const [svgPreview, setSvgPreview] = useState(true)
  const [paletteQuery, setPaletteQuery] = useState('')
  const lastEscape = useRef(0)
  const viewRef = useRef(view)
  const zenRef = useRef(zen)
  viewRef.current = view
  zenRef.current = zen
  const chord = useRef<'' | 'k'>('')
  const switchRef = useRef<(next: WorkspaceId) => void>(() => {})
  const chordTimer = useRef(0)
  const editorPane = useRef<HTMLDivElement>(null)
  const consolePane = useRef<HTMLDivElement>(null)
  const editorWidth = useRef(0)
  const consoleHeight = useRef(240)
  const consoleWidth = useRef(360)
  const desktopRef = useRef(desktop)
  const actions = useRef(project)
  desktopRef.current = desktop
  actions.current = project

  useEffect(() => {
    if (!editorPane.current || !consolePane.current) return
    if (!desktop) {
      editorPane.current.style.width = ''
      consolePane.current.style.height = ''
      consolePane.current.style.width = ''
      return
    }
    if (!project.previewOpen) editorPane.current.style.width = ''
    else if (editorWidth.current) editorPane.current.style.width = `${editorWidth.current}px`
    if (project.panelLayout === 'right') {
      consolePane.current.style.height = ''
      consolePane.current.style.width = project.consoleOpen ? `${consoleWidth.current}px` : '0px'
    } else if (project.panelLayout === 'full') {
      consolePane.current.style.width = ''
      consolePane.current.style.height = ''
    } else {
      consolePane.current.style.width = ''
      consolePane.current.style.height = project.consoleOpen ? `${consoleHeight.current}px` : '0px'
    }
  }, [desktop, project.consoleOpen, project.previewOpen, project.panelLayout])

  useEffect(() => {
    syncExternalPreview(project.previewHtml)
  }, [project.previewHtml])

  useEffect(() => {
    setSvgPreview(true)
  }, [project.active])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (suspendedRef.current) return
      const api = actions.current
      const stop = () => {
        event.preventDefault()
        event.stopPropagation()
      }
      if (event.key === 'Escape' && (api.paletteOpen || api.dialog || panel)) {
        event.preventDefault()
        api.setPaletteOpen(false)
        api.setDialog(null)
        setPanel(null)
        chord.current = ''
        return
      }
      if (event.key === 'Escape' && zenRef.current) {
        const now = Date.now()
        if (now - lastEscape.current < 600) setZen(false)
        lastEscape.current = now
      }
      const meta = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      if (meta && !event.altKey && !event.shiftKey && (key === 'j' || event.code === 'Backquote') && !api.dialog && !api.paletteOpen) {
        stop()
        if (event.code === 'Backquote') {
          const showing = api.consoleOpen && api.consoleTab === 'terminal'
          api.setConsoleTab('terminal')
          api.setConsoleOpen(!showing)
          api.setMobilePane('console')
          if (!showing) window.setTimeout(() => document.querySelector<HTMLInputElement>('[data-testid="terminal-input"]')?.focus(), 50)
          else window.setTimeout(() => api.editorRef.current?.focus(), 50)
        } else api.setConsoleOpen((open) => !open)
        return
      }
      if (meta && !event.altKey && (event.code === 'Equal' || event.code === 'NumpadAdd' || event.code === 'Minus' || event.code === 'NumpadSubtract' || event.code === 'Digit0' || event.code === 'Numpad0')) {
        stop()
        const step = event.code === 'Digit0' || event.code === 'Numpad0' ? 0 : event.code === 'Equal' || event.code === 'NumpadAdd' ? 1 : -1
        if (document.activeElement?.closest('[data-testid="console-panel"]')) zoomPanel(step)
        else zoomEditor(step)
        return
      }
      if (isFormField(event.target) || api.dialog || api.paletteOpen || panel === 'themes') return
      if (chord.current === 'k') {
        window.clearTimeout(chordTimer.current)
        chord.current = ''
        statusStore.setNotice('')
        if (meta && key === 's') {
          event.preventDefault()
          event.stopPropagation()
          setPanel('shortcuts')
        } else if (meta && key === 't') {
          event.preventDefault()
          event.stopPropagation()
          setPanel('themes')
        } else if (!meta && event.code === 'KeyZ') {
          stop()
          setZen((on) => !on)
        } else if (!meta && event.code === 'KeyH') {
          stop()
          toggleHeader()
        } else if (!meta && event.code === 'KeyW') {
          stop()
          window.dispatchEvent(new CustomEvent('pg:command', { detail: 'workspace' }))
        }
        return
      }
      if (event.key === 'F2' && !inMonaco(event.target) && canRename(api.active)) {
        event.preventDefault()
        api.setDialog({ type: 'rename', path: api.active, kind: 'file' })
        return
      }
      if (event.shiftKey && event.altKey && !meta && event.code === 'KeyF') {
        stop()
        void api.format()
        return
      }
      if (event.altKey && !meta && event.code === 'KeyN') {
        stop()
        api.setDialog(event.shiftKey ? { type: 'folder' } : { type: 'new' })
        return
      }
      if (event.altKey && !meta && !event.shiftKey && event.code === 'KeyW') {
        stop()
        api.closeTab(api.active)
        return
      }
      if (!meta) return
      if (event.altKey && !event.shiftKey && event.code === 'KeyS') {
        stop()
        uploadRef.current.download()
        return
      }
      if (event.code === 'KeyK' && !event.shiftKey && !event.altKey && !inMonaco(event.target)) {
        event.preventDefault()
        event.stopPropagation()
        chord.current = 'k'
        statusStore.setNotice('Ctrl+K — Ctrl+S shortcuts, Ctrl+T themes, W workspace, Z zen mode, H header')
        chordTimer.current = window.setTimeout(() => {
          chord.current = ''
          statusStore.setNotice('')
        }, 1400)
        return
      }
      if (event.shiftKey && !event.altKey && (key === 'f' || key === 'e' || key === 'u')) {
        event.preventDefault()
        event.stopPropagation()
        const next: SideView = key === 'f' ? 'search' : key === 'e' ? 'explorer' : 'outline'
        if (next === 'search') setSearchFocus((value) => value + 1)
        setView(next)
        api.setSidebarOpen(true)
        return
      }
      if (key === 's' && !event.shiftKey && !event.altKey) {
        stop()
        uploadRef.current.save()
      } else if (key === 'o' && !event.shiftKey && !event.altKey) {
        stop()
        uploadRef.current.files()
      } else if (key === 'enter') {
        event.preventDefault()
        event.stopPropagation()
        api.run()
      } else if (key === 'p') {
        event.preventDefault()
        event.stopPropagation()
        setPaletteQuery(event.shiftKey ? '>' : '')
        api.setPaletteOpen(true)
      } else if (key === 'b') {
        event.preventDefault()
        event.stopPropagation()
        api.setSidebarOpen((open) => !open)
      } else if (key === ',' && !event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        setPanel((current) => (current === 'settings' ? null : 'settings'))
      } else if (key === 'n' && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        api.setDialog(event.shiftKey ? { type: 'folder' } : { type: 'new' })
      } else if (key === 'w' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        api.closeTab(api.active)
      } else if (event.code === 'Backslash' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        api.setPreviewOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [panel])

  useEffect(() => {
    const onCommand = (event: Event) => {
      const name = event instanceof CustomEvent ? String(event.detail) : ''
      if (name === 'zen') setZen((on) => !on)
      else if (name === 'header') toggleHeader()
      else if (name === 'templates') setTemplates(true)
      else if (name === 'tour') setTour(true)
      else if (name === 'themes') setPanel('themes')
      else if (name === 'shortcuts') setPanel('shortcuts')
      else if (name === 'workspace') {
        const ids = WORKSPACE_IDS
        switchRef.current(ids[(ids.indexOf(workspaceStore.get()) + 1) % ids.length])
      }
      else if (name === 'run') actions.current.run()
      else if (name === 'reveal-explorer') {
        setView('explorer')
        actions.current.setSidebarOpen(true)
      } else if (name === 'copy-path') {
        void copyText(actions.current.active).then((ok) => statusStore.flash(ok ? 'Path copied' : actions.current.active))
      } else if (name === 'download-file') {
        const text = actions.current.getFiles()[actions.current.active]
        if (text != null) downloadFile(actions.current.active, text)
      }
    }
    window.addEventListener('pg:command', onCommand)
    return () => window.removeEventListener('pg:command', onCommand)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => project.editorRef.current?.relayout(), 220)
    return () => window.clearTimeout(timer)
  }, [zen, project.sidebarOpen, project.editorRef])

  const creatingType = project.dialog?.type === 'new' || project.dialog?.type === 'folder' ? project.dialog.type : null
  useEffect(() => {
    if (!creatingType) return
    setZen(false)
    setView('explorer')
    project.setSidebarOpen(true)
  }, [creatingType, project.setSidebarOpen])

  const creating =
    project.dialog?.type === 'new'
      ? { kind: 'file' as const, parent: project.dialog.folder ?? parentFolders(project.active).pop() ?? '' }
      : project.dialog?.type === 'folder'
        ? { kind: 'folder' as const, parent: project.dialog.parent ?? parentFolders(project.active).pop() ?? '' }
        : null

  const showView = (next: SideView) => {
    if (next === 'search') setSearchFocus((value) => value + 1)
    if (project.sidebarOpen && viewRef.current === next && next !== 'search') project.setSidebarOpen(false)
    else project.setSidebarOpen(true)
    setView(next)
  }

  const errorCount = project.problems.filter((problem) => problem.severity === 'error').length
  const warningCount = project.problems.length - errorCount

  const problemFiles = useMemo(() => {
    const files = new Set<string>()
    for (const problem of project.problems) {
      if (problem.severity === 'error' && problem.file) files.add(problem.file)
    }
    return files
  }, [project.problems])

  const fileProblems = useMemo(() => {
    const files: Record<string, FileProblems> = {}
    for (const problem of project.problems) {
      if (!problem.file) continue
      const entry = (files[problem.file] ??= { errors: 0, warnings: 0 })
      if (problem.severity === 'error') entry.errors += 1
      else entry.warnings += 1
    }
    return files
  }, [project.problems])

  const sidePanel = desktop && project.panelLayout === 'right'
  const fullPanel = desktop && project.panelLayout === 'full' && !zen
  const imageActive = isImageFile(project.active)
  const svgActive = isSvgFile(project.active)
  const mediaActive = imageActive || (svgActive && svgPreview)
  const showCode = desktop || project.mobilePane === 'code'
  const showPreview = desktop ? project.previewOpen : project.mobilePane === 'preview'
  const showConsole = desktop ? (project.consoleOpen || fullPanel) && !zen : project.mobilePane === 'console'
  const sidebarOpen = project.sidebarOpen && !zen

  const saveNow = async () => {
    const formatted = settingsStore.get().formatOnSave
    if (formatted) await project.format()
    project.save()
    statusStore.flash(formatted ? 'Formatted and saved' : 'Saved')
  }

  const importUpload = async (pending: Promise<UploadResult>) => {
    try {
      const { files, skipped, root } = await pending
      if (!files.length) {
        statusStore.flash(skipped.length ? `Nothing imported: ${skipped.length} file(s) unsupported or larger than 250 KB` : 'No files found', 3500)
        return
      }
      if (root) {
        if (!window.confirm(`Open folder "${root}" as this workspace's project? It replaces the current files.`)) return
        actions.current.loadImported(files, root)
        setView('explorer')
        actions.current.setSidebarOpen(true)
        statusStore.flash(`Opened ${root} — ${files.length} file${files.length === 1 ? '' : 's'}${skipped.length ? `, skipped ${skipped.length}` : ''}`, 3500)
        return
      }
      const existing = new Set(actions.current.paths)
      const overwrite = files.filter((file) => existing.has(file.path)).length
      if (overwrite && !window.confirm(`Replace ${overwrite} existing file${overwrite === 1 ? '' : 's'} with the uploaded version?`)) return
      const count = actions.current.importFiles(files)
      setView('explorer')
      actions.current.setSidebarOpen(true)
      statusStore.flash(`Imported ${count} file${count === 1 ? '' : 's'}${skipped.length ? `, skipped ${skipped.length}` : ''}`, 3500)
    } catch {
      statusStore.flash('Could not read those files', 3000)
    }
  }

  const picked = (input: HTMLInputElement) => {
    if (input.files?.length) void importUpload(fromFileList(input.files))
    input.value = ''
  }

  const hasFiles = (event: ReactDragEvent) => Array.from(event.dataTransfer.types).includes('Files')
  const dragEnter = (event: ReactDragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    dragDepth.current += 1
    setDragging(true)
  }
  const dragLeave = (event: ReactDragEvent) => {
    if (!hasFiles(event)) return
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (!dragDepth.current) setDragging(false)
  }
  const dragOver = (event: ReactDragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }
  const drop = (event: ReactDragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = 0
    setDragging(false)
    void importUpload(fromDataTransfer(event.dataTransfer))
  }

  const downloadPath = (path: string) => {
    const text = project.getFiles()[path]
    if (text == null) return
    downloadFile(path, text)
    statusStore.flash(`Downloaded ${path.split('/').pop()}`)
  }
  const downloadFolder = (folder: string) => {
    const count = downloadFiles(project.getFiles(), folder)
    statusStore.flash(count ? `Downloaded ${folder}.zip (${count} file${count === 1 ? '' : 's'})` : `${folder} has no files to download`)
  }

  const share = async () => {
    try {
      const url = await createShareUrl({ files: project.getFiles(), active: project.active, folders: project.folders, workspace: project.workspace })
      if (await copyText(url)) statusStore.setNotice(url.length > 8000 ? 'Share link copied (large project, some apps may truncate it)' : 'Share link copied to clipboard')
      else {
        window.prompt('Copy this share link', url)
        return
      }
    } catch {
      statusStore.setNotice('Could not copy the share link')
    }
    window.setTimeout(() => statusStore.setNotice(''), 2500)
  }

  const popout = () => {
    if (!openExternalPreview(project.previewHtml)) statusStore.setNotice('Allow pop-ups to open the preview')
  }
  const download = () => {
    const info = WORKSPACES[project.workspace]
    if (info.kind === 'web') {
      void downloadWebProject(project.getFiles(), info.root).then(() => statusStore.flash(`Downloaded ${info.root}.zip`))
    } else if (info.kind === 'react') {
      downloadProject(project.getFiles())
      statusStore.flash('Downloaded project as a runnable Vite app')
    } else {
      downloadFiles(project.getFiles(), '', info.root)
      statusStore.flash(`Downloaded ${info.root}.zip`)
    }
  }
  const switchWorkspace = (next: WorkspaceId) => {
    if (next === project.workspace) return
    project.save()
    workspaceStore.set(next)
  }
  switchRef.current = switchWorkspace
  const startTemplate = (template: Template) => {
    setTemplates(false)
    if (template.workspace === project.workspace) {
      project.openProject(template.project())
      statusStore.flash(`Started ${template.name}`)
      return
    }
    project.save()
    saveProject(template.project(), template.workspace)
    workspaceStore.set(template.workspace)
  }
  uploadRef.current = { files: () => fileInput.current?.click(), download, save: () => void saveNow() }

  useEffect(() => {
    if (folderInput.current) folderInput.current.webkitdirectory = true
  }, [])

  const paletteExtra: PaletteCommand[] = [
    { id: 'upload-files', label: 'File: Upload Files…', hint: 'Ctrl+O', run: () => fileInput.current?.click() },
    { id: 'upload-folder', label: 'File: Upload Folder…', run: () => folderInput.current?.click() },
    { id: 'save', label: 'File: Save', hint: 'Ctrl+S', run: () => void saveNow() },
    { id: 'autosave', label: `File: Toggle Auto Save (${settingsStore.get().autoSave ? 'on' : 'off'})`, run: () => settingsStore.update({ autoSave: !settingsStore.get().autoSave }) },
    { id: 'download-file', label: 'File: Download Current File', run: () => downloadPath(project.active) },
    ...(WORKSPACES[project.workspace].kind !== 'web' ? [{ id: 'download-sources', label: 'File: Download Source Files (.zip)', run: () => downloadFolder('') }] : []),
    { id: 'templates', label: 'File: New Project from Template…', run: () => setTemplates(true) },
    ...WORKSPACE_IDS.filter((id) => id !== project.workspace).map((id) => ({ id: `workspace-${id}`, label: `Workspace: Switch to ${WORKSPACES[id].label}`, hint: 'Ctrl+K W', run: () => switchWorkspace(id) })),
    { id: 'terminal', label: 'View: Toggle Terminal', hint: 'Ctrl+`', run: () => { project.setConsoleTab('terminal'); project.setConsoleOpen(true); project.setMobilePane('console') } },
    { id: 'output', label: 'View: Show Output', run: () => { project.setConsoleTab('output'); project.setConsoleOpen(true); project.setMobilePane('console') } },
    { id: 'debug-console', label: 'View: Show Debug Console', run: () => { project.setConsoleTab('debug'); project.setConsoleOpen(true); project.setMobilePane('console') } },
    { id: 'panel-bottom', label: 'View: Move Panel to Bottom', run: () => project.setPanelLayout('bottom') },
    { id: 'panel-right', label: 'View: Move Panel Right', run: () => project.setPanelLayout('right') },
    { id: 'panel-full', label: 'View: Toggle Maximized Panel', run: () => project.setPanelLayout(project.panelLayout === 'full' ? 'bottom' : 'full') },
    { id: 'zoom-in', label: 'View: Editor Font Zoom In', hint: 'Ctrl+=', run: () => zoomEditor(1) },
    { id: 'zoom-out', label: 'View: Editor Font Zoom Out', hint: 'Ctrl+-', run: () => zoomEditor(-1) },
    { id: 'zoom-reset', label: 'View: Editor Font Zoom Reset', hint: 'Ctrl+0', run: () => zoomEditor(0) },
    { id: 'header', label: `View: ${showHeader ? 'Hide' : 'Show'} Top Header`, hint: 'Ctrl+K H', run: toggleHeader },
    { id: 'tour', label: 'Help: Start Walkthrough', run: () => setTour(true) },
    { id: 'docs', label: 'Help: Open Documentation', run: () => (location.hash = '#/docs') },
    { id: 'guide', label: 'Help: Open Guides', run: () => (location.hash = '#/guide') },
    { id: 'home', label: 'Help: About Playground', run: () => (location.hash = '#/home') },
  ]

  const dragEditor = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!desktopRef.current || !editorPane.current) return
    const handle = event.currentTarget
    const startX = event.clientX
    const startW = editorPane.current.getBoundingClientRect().width
    handle.setPointerCapture(event.pointerId)
    const previousCursor = document.body.style.cursor
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const move = (ev: PointerEvent) => {
      const root = editorPane.current?.parentElement
      if (!root || !editorPane.current) return
      const next = startW + ev.clientX - startX
      const previewW = root.clientWidth - next - 8
      if (previewW < 140) {
        editorWidth.current = 0
        editorPane.current.style.width = ''
        actions.current.setPreviewOpen(false)
        return
      }
      const clamped = Math.min(root.clientWidth - 280, Math.max(280, next))
      editorWidth.current = clamped
      editorPane.current.style.width = `${clamped}px`
      actions.current.setPreviewOpen(true)
    }
    const up = (ev: PointerEvent) => {
      if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = ''
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  const dragConsole = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!desktopRef.current || !consolePane.current) return
    const handle = event.currentTarget
    const startY = event.clientY
    const startH = consolePane.current.getBoundingClientRect().height
    handle.setPointerCapture(event.pointerId)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    const move = (ev: PointerEvent) => {
      const column = consolePane.current?.parentElement
      if (!column || !consolePane.current) return
      const next = startH + (startY - ev.clientY)
      if (next < 72) {
        consolePane.current.style.height = '0px'
        actions.current.setConsoleOpen(false)
        return
      }
      const height = Math.min(column.clientHeight * 0.72, next)
      consoleHeight.current = height
      consolePane.current.style.height = `${height}px`
      actions.current.setConsoleOpen(true)
    }
    const up = (ev: PointerEvent) => {
      if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  const dragPanelSide = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!desktopRef.current || !consolePane.current) return
    const handle = event.currentTarget
    const startX = event.clientX
    const startW = consolePane.current.getBoundingClientRect().width
    handle.setPointerCapture(event.pointerId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const move = (ev: PointerEvent) => {
      const row = consolePane.current?.parentElement
      if (!row || !consolePane.current) return
      const next = startW + (startX - ev.clientX)
      if (next < 120) {
        consolePane.current.style.width = '0px'
        actions.current.setConsoleOpen(false)
        return
      }
      const width = Math.min(row.clientWidth * 0.7, next)
      consoleWidth.current = width
      consolePane.current.style.width = `${width}px`
      actions.current.setConsoleOpen(true)
    }
    const up = (ev: PointerEvent) => {
      if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  return (
    <div
      data-shell
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-app text-fg"
      onDragEnterCapture={dragEnter}
      onDragLeaveCapture={dragLeave}
      onDragOverCapture={dragOver}
      onDropCapture={drop}
    >
      <input ref={fileInput} type="file" multiple hidden data-testid="upload-files" onChange={(event) => picked(event.currentTarget)} />
      <input ref={folderInput} type="file" multiple hidden data-testid="upload-folder" onChange={(event) => picked(event.currentTarget)} />
      {!zen && showHeader && (
      <TitleBar
        onRun={project.run}
        onFormat={project.format}
        onReset={() => project.setDialog({ type: 'reset' })}
        onToggleSidebar={() => project.setSidebarOpen((open) => !open)}
        onTogglePreview={() => project.setPreviewOpen((open) => !open)}
        onToggleConsole={() => project.setConsoleOpen((open) => !open)}
        onDownload={download}
        onSettings={() => setPanel('settings')}
        onShortcuts={() => setPanel('shortcuts')}
        onThemes={() => setPanel('themes')}
        onShare={() => void share()}
        onHide={toggleHeader}
        previewOpen={project.previewOpen}
        consoleOpen={project.consoleOpen}
        compact={!desktop}
        workspace={project.workspace}
        onWorkspace={switchWorkspace}
      />
      )}
      <div className="relative flex min-h-0 flex-1">
        {desktop && !zen && (
          <ActivityBar view={view} open={project.sidebarOpen} onView={showView} onThemes={() => setPanel('themes')} onSettings={() => setPanel('settings')} />
        )}
        <aside
          data-tour="sidebar"
          className={
            desktop
              ? `h-full shrink-0 overflow-hidden border-fg/10 transition-[width] duration-200 ${sidebarOpen ? 'w-64 border-r' : 'w-0'}`
              : `absolute inset-y-0 left-0 z-40 h-full shadow-2xl transition-transform ${sidebarOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'}`
          }
        >
          {view === 'search' ? (
            <SearchView getFiles={project.getFiles} onReveal={project.goTo} onReplace={project.replaceFile} focusKey={searchFocus} />
          ) : view === 'outline' ? (
            <OutlineView active={project.active} getFiles={project.getFiles} onReveal={project.goTo} />
          ) : (
          <Sidebar
            root={project.name ?? WORKSPACES[project.workspace].root}
            paths={project.paths}
            folders={project.folders}
            active={project.active}
            fileProblems={fileProblems}
            onCreate={(folder) => project.setDialog({ type: 'new', folder })}
            onCreateFolder={(parent) => project.setDialog({ type: 'folder', parent })}
            creating={creating}
            folderNames={uniqueFolders([...project.folders, ...project.paths.flatMap((path) => parentFolders(path))])}
            onCreateSubmit={(path) => (creating?.kind === 'folder' ? project.createFolder(path) : project.createFile(path))}
            onCreateCancel={() => project.setDialog(null)}
            onRename={(path, kind) => project.setDialog({ type: 'rename', path, kind })}
            onMove={project.move}
            onDelete={project.deleteFile}
            onDeleteFolder={(path) => project.setDialog({ type: 'delete-folder', path })}
            onUploadFiles={() => fileInput.current?.click()}
            onUploadFolder={() => folderInput.current?.click()}
            onDownloadFile={downloadPath}
            onDownloadFolder={downloadFolder}
            onOpen={(path) => {
              project.openTab(path)
              if (!desktop) project.setSidebarOpen(false)
            }}
          />
          )}
        </aside>
        {!desktop && sidebarOpen && (
          <button type="button" aria-label="Close files" className="absolute inset-0 z-30 bg-black/55" onClick={() => project.setSidebarOpen(false)} />
        )}
        <div className={`flex min-w-0 flex-1 ${sidePanel ? 'flex-row' : 'flex-col'}`}>
          <div className={`${fullPanel ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-1`}>
            <div ref={editorPane} data-tour="editor" className={`${showCode ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col ${desktop && project.previewOpen ? 'w-[58%]' : 'w-full flex-1'}`}>
              <TabBar
                tabs={project.openTabs}
                active={project.active}
                problems={problemFiles}
                unsaved={project.unsaved}
                extra={
                  svgActive ? (
                    <button
                      type="button"
                      data-testid="svg-preview-toggle"
                      title={svgPreview ? 'Show SVG source' : 'Show SVG preview'}
                      aria-label={svgPreview ? 'Show SVG source' : 'Show SVG preview'}
                      aria-pressed={svgPreview}
                      onClick={() => setSvgPreview((on) => !on)}
                      className={`rounded-md p-1.5 ${svgPreview ? 'bg-fg/10 text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg'}`}
                    >
                      {svgPreview ? <Code size={14} /> : <Eye size={14} />}
                    </button>
                  ) : undefined
                }
                onSelect={project.setActive}
                onClose={project.closeTab}
              />
              <Breadcrumbs active={project.active} getFiles={project.getFiles} onReveal={project.goTo} onFolder={() => showView('explorer')} />
              <div className="relative flex min-h-0 flex-1 flex-col">
                <CodeEditor
                  ref={project.editorRef}
                  active={project.active}
                  visible={showCode && !mediaActive}
                  getFiles={project.getFiles}
                  onEdit={project.onEdit}
                  onMarkers={project.onMarkers}
                  onOpen={project.openTab}
                />
                {mediaActive && <ImageView path={project.active} content={project.getFiles()[project.active] ?? ''} />}
              </div>
            </div>
            {desktop && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize preview. Drag closed to hide it."
                className="group relative z-20 w-2 shrink-0 cursor-col-resize touch-none"
                onPointerDown={dragEditor}
                onDoubleClick={() => project.setPreviewOpen((open) => !open)}
              >
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-fg/10 group-hover:bg-accent" />
              </div>
            )}
            <div data-tour="preview" className={`${showPreview ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col`}>
              <PreviewPane
                html={project.previewHtml}
                device={project.device}
                problems={project.problems}
                iframeRef={project.iframeRef}
                onDevice={project.setDevice}
                onReload={project.run}
                onReveal={project.revealProblem}
                onClose={() => project.setPreviewOpen(false)}
                onPopout={popout}
              />
            </div>
          </div>
          {desktop && !fullPanel && (
            <div
              role="separator"
              aria-orientation={sidePanel ? 'vertical' : 'horizontal'}
              aria-label="Resize panel. Drag closed to hide it."
              className={`group relative z-20 shrink-0 touch-none ${sidePanel ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize'}`}
              onPointerDown={sidePanel ? dragPanelSide : dragConsole}
              onDoubleClick={() => {
                if (sidePanel) consoleWidth.current = 360
                else consoleHeight.current = 240
                actions.current.setConsoleOpen((open) => !open)
              }}
            >
              <span className={`absolute bg-fg/10 group-hover:bg-accent ${sidePanel ? 'inset-y-0 left-1/2 w-px -translate-x-1/2' : 'inset-x-0 top-1/2 h-px -translate-y-1/2'}`} />
            </div>
          )}
          <div
            ref={consolePane}
            className={`${showConsole ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col overflow-hidden ${desktop ? (sidePanel ? 'h-full shrink-0' : fullPanel ? 'flex-1' : '') : 'flex-1'}`}
          >
            <ConsolePanel
              entries={project.entries}
              problems={project.problems}
              tab={project.consoleTab}
              preserve={project.preserveLog}
              layout={project.panelLayout}
              onLayout={project.setPanelLayout}
              onTab={project.setConsoleTab}
              onPreserve={project.setPreserveLog}
              onClear={project.clearConsole}
              onEval={project.evalInPreview}
              shell={{
                root: project.name ?? WORKSPACES[project.workspace].root,
                workspace: project.workspace,
                files: project.getFiles,
                folders: () => actions.current.folders,
                problems: () => actions.current.problems,
                createFile: (path) => project.createFile(path, false),
                writeFile: project.replaceFile,
                createFolder: project.createFolder,
                deleteFile: project.deleteFile,
                deleteFolder: project.deleteFolder,
                renameFile: project.renameFile,
                renameFolder: project.renameFolder,
                open: (path) => {
                  project.openTab(path)
                  requestAnimationFrame(() => project.editorRef.current?.reveal(path, 1, 1))
                },
                run: project.run,
                close: () => project.setConsoleOpen(false),
              }}
              onReveal={(problem) => {
                project.revealProblem(problem)
                project.setConsoleTab('problems')
              }}
              onClose={
                desktop
                  ? () => {
                      if (project.panelLayout === 'full') project.setPanelLayout('bottom')
                      project.setConsoleOpen(false)
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
      {!desktop && (
        <nav className="flex h-12 shrink-0 border-t border-fg/10 bg-sidebar">
          <MobileButton pane="code" current={project.mobilePane} onSelect={project.setMobilePane} icon={<Code size={15} />} label="Code" />
          <MobileButton
            pane="preview"
            current={project.mobilePane}
            onSelect={(pane) => {
              project.setSidebarOpen(false)
              project.setMobilePane(pane)
            }}
            icon={<Eye size={15} />}
            label="Preview"
          />
          <MobileButton
            pane="console"
            current={project.mobilePane}
            onSelect={(pane) => {
              project.setSidebarOpen(false)
              project.setMobilePane(pane)
            }}
            icon={<Terminal size={15} />}
            label="Panel"
          />
        </nav>
      )}
      {panel === 'themes' && <ThemePicker onClose={() => setPanel(null)} />}
      {(panel === 'settings' || panel === 'shortcuts') && (
        <div className={`absolute inset-x-0 bottom-6 z-40 ${showHeader && !zen ? 'top-12' : 'top-0'}`}>
          {panel === 'settings' ? <SettingsPanel onClose={() => setPanel(null)} /> : <ShortcutsPanel onClose={() => setPanel(null)} />}
        </div>
      )}
      {zen && (
        <button
          type="button"
          onClick={() => setZen(false)}
          className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-fg/10 bg-elevated/90 px-3 py-1 text-[11px] text-muted shadow-lg backdrop-blur hover:text-fg"
        >
          <Minimize2 size={12} /> Exit Zen Mode <span className="opacity-60">Esc Esc</span>
        </button>
      )}
      {!zen && !showHeader && (
        <button
          type="button"
          data-testid="show-header"
          title="Show header (Ctrl+K H)"
          onClick={toggleHeader}
          className="absolute right-3 top-1 z-30 flex items-center gap-1 rounded-full border border-fg/10 bg-elevated/90 px-2.5 py-0.5 text-[11px] text-muted shadow-lg backdrop-blur hover:text-fg"
        >
          <ChevronsDown size={12} /> Header
        </button>
      )}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-[60] grid place-items-center bg-app/70 backdrop-blur-sm" data-testid="drop-overlay">
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-accent/70 bg-elevated/90 px-12 py-10 text-center shadow-glow">
            <Upload size={28} className="text-accent" />
            <p className="text-base font-semibold text-fg">Drop files or folders to import</p>
            <p className="max-w-xs text-xs text-muted">HTML, CSS, JS, TS, JSX, TSX, JSON, Markdown, and more. node_modules, .git, and dist are skipped.</p>
          </div>
        </div>
      )}
      {templates && (
        <TemplatePicker
          templates={TEMPLATES}
          onCancel={() => setTemplates(false)}
          onPick={startTemplate}
        />
      )}
      {tour && !zen && (
        <Walkthrough
          onTemplates={() => setTemplates(true)}
          onDone={() => setTour(false)}
        />
      )}
      {!zen && (
        <StatusBar
          unsaved={project.unsaved.size}
          onSave={() => void saveNow()}
          onTheme={() => setPanel('themes')}
          errors={errorCount}
          warnings={warningCount}
          onProblems={() => {
            project.setConsoleOpen(true)
            project.setConsoleTab('problems')
            project.setMobilePane('console')
          }}
        />
      )}
      {project.dialog?.type === 'rename' && (
        <RenameDialog
          path={project.dialog.path}
          kind={project.dialog.kind}
          existingFiles={project.paths}
          existingFolders={project.folders}
          onCancel={() => project.setDialog(null)}
          onRename={(next) => {
            const current = project.dialog
            if (current?.type !== 'rename') return
            if (current.kind === 'folder') project.renameFolder(current.path, next)
            else project.renameFile(current.path, next)
          }}
        />
      )}
      {project.dialog?.type === 'delete-folder' && (
        <DeleteFolderDialog
          path={project.dialog.path}
          count={project.paths.filter((path) => path.startsWith(`${project.dialog?.type === 'delete-folder' ? project.dialog.path : ''}/`)).length}
          onCancel={() => project.setDialog(null)}
          onDelete={() => {
            const current = project.dialog
            if (current?.type === 'delete-folder') project.deleteFolder(current.path)
          }}
        />
      )}
      {project.dialog?.type === 'reset' && <ResetDialog name={WORKSPACES[project.workspace].label} onCancel={() => project.setDialog(null)} onReset={project.reset} />}
      {project.paletteOpen && (
        <CommandPalette
          files={project.paths}
          initialQuery={paletteQuery}
          onClose={() => project.setPaletteOpen(false)}
          onOpen={project.openTab}
          onRun={project.run}
          onReset={() => project.setDialog({ type: 'reset' })}
          onConsole={() => project.setConsoleOpen((open) => !open)}
          onPreview={() => project.setPreviewOpen((open) => !open)}
          onSidebar={() => project.setSidebarOpen((open) => !open)}
          onClear={project.clearConsole}
          onNew={() => project.setDialog({ type: 'new' })}
          onFolder={() => project.setDialog({ type: 'folder' })}
          onRename={() => {
            if (canRename(project.active)) project.setDialog({ type: 'rename', path: project.active, kind: 'file' })
          }}
          onSettings={() => setPanel('settings')}
          onShortcuts={() => setPanel('shortcuts')}
          onThemes={() => setPanel('themes')}
          onInstall={() => void installStore.prompt()}
          onShare={() => void share()}
          onZen={() => setZen((on) => !on)}
          onView={showView}
          onDownload={download}
          onPopout={popout}
          onFormat={() => void project.format()}
          extra={paletteExtra}
        />
      )}
    </div>
  )
}

function zoomEditor(step: -1 | 0 | 1) {
  const size = step === 0 ? DEFAULT_SETTINGS.fontSize : settingsStore.get().fontSize + step
  settingsStore.update({ fontSize: size })
  statusStore.flash(`Editor font size: ${settingsStore.get().fontSize}px`)
}

function zoomPanel(step: -1 | 0 | 1) {
  const size = step === 0 ? DEFAULT_SETTINGS.panelFontSize : settingsStore.get().panelFontSize + step
  settingsStore.update({ panelFontSize: size })
  statusStore.flash(`Panel font size: ${settingsStore.get().panelFontSize}px`)
}

function toggleHeader() {
  settingsStore.update({ showHeader: !settingsStore.get().showHeader })
}

function isFormField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest('.monaco-editor')) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function inMonaco(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('.monaco-editor'))
}

function MobileButton({ pane, current, onSelect, icon, label }: { pane: MobilePane; current: MobilePane; onSelect: (pane: MobilePane) => void; icon: ReactNode; label: string }) {
  const selected = pane === current
  return (
    <button type="button" onClick={() => onSelect(pane)} className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${selected ? 'text-fg' : 'text-muted/75'}`}>
      {icon}
      {label}
    </button>
  )
}
