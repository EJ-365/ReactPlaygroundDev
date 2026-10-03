import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { canRename, fileMeta, folderChain, isValidFileName, isValidFolderName, moveFiles, movesForPrefix, parentFolders, uniqueFolders, withPinnedTabs } from '../lib/files'
import { clearProject, loadProject, saveProject, type SavedProject } from '../lib/storage'
import { editEvents } from '../lib/editEvents'
import { settingsStore } from '../lib/settings'
import type { Incoming } from '../lib/upload'
import { externalPreviewWindow } from '../lib/previewWindow'
import { statusStore } from '../lib/statusStore'
import { WORKSPACES, workspaceStore } from '../lib/workspace'
import { subscribeTailwind, tailwindReady } from '../lib/tailwindService'
import type { ConsoleEntry, ConsoleLevel, ConsoleTab, Device, EditorHandle, MobilePane, PanelLayout, Problem, Ser } from '../types'

const LAYOUT_KEY = 'react-playground.layout'

function loadLayout() {
  try {
    const data = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '') as { previewOpen?: boolean; consoleOpen?: boolean; panelLayout?: string }
    return {
      previewOpen: data.previewOpen !== false,
      consoleOpen: data.consoleOpen !== false,
      panelLayout: (data.panelLayout === 'right' || data.panelLayout === 'full' ? data.panelLayout : 'bottom') as PanelLayout,
    }
  } catch {
    return { previewOpen: true, consoleOpen: true, panelLayout: 'bottom' as PanelLayout }
  }
}

export type ProjectDialog =
  | null
  | { type: 'new'; folder?: string }
  | { type: 'folder'; parent?: string }
  | { type: 'rename'; path: string; kind: 'file' | 'folder' }
  | { type: 'delete-folder'; path: string }
  | { type: 'reset' }

function sameProblems(a: Problem[], b: Problem[]) {
  if (a.length !== b.length) return false
  return a.every((problem, index) => problem.id === b[index]?.id && problem.message === b[index]?.message)
}

export function useProject() {
  const workspace = useRef(workspaceStore.get()).current
  const stored = useRef(loadProject(workspace))
  const filesRef = useRef<Record<string, string>>(stored.current?.files ?? WORKSPACES[workspace].defaults().files)
  const editorRef = useRef<EditorHandle>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const preserveRef = useRef(false)
  const saveTimer = useRef(0)
  const runLock = useRef(false)
  const rerun = useRef(false)
  const usedCdn = useRef(false)
  const lastError = useRef('')
  const previewRef = useRef('')
  const entryId = useRef(1)
  const evalId = useRef(1)
  const queue = useRef<ConsoleEntry[]>([])
  const frame = useRef(0)

  const [paths, setPaths] = useState(() => Object.keys(filesRef.current))
  const [folders, setFolders] = useState(() => stored.current?.folders ?? [])
  const [name, setName] = useState<string | undefined>(() => stored.current?.name)
  const [openTabs, setOpenTabs] = useState(() => withPinnedTabs(stored.current?.openTabs ?? WORKSPACES[workspace].defaults().openTabs, Object.keys(filesRef.current)))
  const [active, setActive] = useState(() => stored.current?.active ?? WORKSPACES[workspace].defaults().active)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(() => loadLayout().previewOpen)
  const [consoleOpen, setConsoleOpen] = useState(() => loadLayout().consoleOpen)
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('output')
  const [previewHtml, setPreviewHtml] = useState('')
  const [entries, setEntries] = useState<ConsoleEntry[]>([])
  const [markers, setMarkers] = useState<Problem[]>([])
  const [buildProblems, setBuildProblems] = useState<Problem[]>([])
  const [device, setDevice] = useState<Device>('desktop')
  const [mobilePane, setMobilePane] = useState<MobilePane>('code')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [dialog, setDialog] = useState<ProjectDialog>(null)
  const [preserveLog, setPreserveLog] = useState(false)
  const [panelLayout, setPanelLayout] = useState<PanelLayout>(() => loadLayout().panelLayout)
  const tabsRef = useRef(openTabs)
  const activeRef = useRef(active)
  const foldersRef = useRef(folders)
  const nameRef = useRef(name)
  const persistTimer = useRef(0)
  tabsRef.current = openTabs
  activeRef.current = active
  foldersRef.current = folders
  nameRef.current = name

  preserveRef.current = preserveLog

  const [unsaved, setUnsaved] = useState<Set<string>>(() => new Set())
  const [savedAt, setSavedAt] = useState(0)
  const unsavedRef = useRef(unsaved)
  unsavedRef.current = unsaved

  const save = useCallback(() => {
    window.clearTimeout(persistTimer.current)
    saveProject({ files: filesRef.current, openTabs: tabsRef.current, active: activeRef.current, folders: foldersRef.current, name: nameRef.current }, workspace)
    setUnsaved((current) => (current.size ? new Set() : current))
    setSavedAt(Date.now())
  }, [workspace])

  const persist = useCallback(
    (path?: string) => {
      window.clearTimeout(persistTimer.current)
      if (!settingsStore.get().autoSave) {
        if (path && !unsavedRef.current.has(path)) setUnsaved((current) => new Set(current).add(path))
        return
      }
      persistTimer.current = window.setTimeout(save, 400)
    },
    [save],
  )

  useEffect(() => {
    let auto = settingsStore.get().autoSave
    return settingsStore.subscribe(() => {
      const next = settingsStore.get().autoSave
      if (next && !auto && unsavedRef.current.size) save()
      auto = next
    })
  }, [save])

  useEffect(() => {
    const onUnload = (event: BeforeUnloadEvent) => {
      if (!unsavedRef.current.size) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  const flushEntries = useCallback((extra?: ConsoleEntry[]) => {
    if (extra?.length) queue.current.push(...extra)
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const batch = queue.current
      queue.current = []
      if (!batch.length) return
      setEntries((prev) => {
        let next = prev
        for (const item of batch) {
          const last = next[next.length - 1]
          if (last && last.key === item.key && item.time - last.time < 2500 && item.level !== 'input') {
            next = [...next.slice(0, -1), { ...last, count: last.count + 1, time: item.time }]
          } else {
            next = [...next, item]
          }
        }
        return next.length > 400 ? next.slice(-400) : next
      })
    })
  }, [])

  const pushEntry = useCallback(
    (level: ConsoleLevel, args: Ser[], source: ConsoleEntry['source'] = 'page') => {
      const id = entryId.current++
      flushEntries([
        {
          id,
          level,
          args,
          time: Date.now(),
          count: 1,
          key: `${source}:${level}:${JSON.stringify(args)}`,
          source,
        },
      ])
    },
    [flushEntries],
  )

  const publish = useCallback(async () => {
    if (runLock.current) {
      rerun.current = true
      return
    }
    runLock.current = true
    statusStore.setPhase('building')
    try {
      do {
        rerun.current = false
        const snapshot = { ...filesRef.current }
        const { compileProject } = await import('../lib/compile')
        const result = await compileProject(snapshot, workspace)
        if (rerun.current) continue
        usedCdn.current = result.useCdn
        setBuildProblems(result.problems)
        const signature = result.problems
          .filter((problem) => problem.severity === 'error')
          .map((problem) => problem.message)
          .join('\n')
        if (signature && signature !== lastError.current) {
          pushEntry('error', [{ t: 'string', v: signature }])
        }
        lastError.current = signature
        if (previewRef.current !== result.html) {
          previewRef.current = result.html
          if (!preserveRef.current) {
            queue.current = queue.current.filter((entry) => entry.source === 'repl')
            setEntries((prev) => prev.filter((entry) => entry.source === 'repl'))
          }
          pushEntry('system', [{ t: 'string', v: `Running ${workspace === 'web' ? 'index.html' : 'main.tsx'}` }])
          setPreviewHtml(result.html)
        } else if (result.ok) {
          statusStore.setPhase('ready')
        }
        if (!result.ok) statusStore.setPhase('error')
      } while (rerun.current)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The preview could not be compiled.'
      statusStore.setPhase('error')
      setBuildProblems([
        { id: 'compiler', severity: 'error', message, source: 'build' },
      ])
      if (message !== lastError.current) pushEntry('error', [{ t: 'string', v: message }])
      lastError.current = message
    } finally {
      runLock.current = false
      if (rerun.current) void publish()
    }
  }, [pushEntry, workspace])

  const schedule = useCallback(
    (immediate = false) => {
      window.clearTimeout(saveTimer.current)
      const wait = immediate ? 0 : 200
      saveTimer.current = window.setTimeout(() => void publish(), wait)
    },
    [publish],
  )

  useEffect(() => {
    schedule(true)
    return subscribeTailwind(() => {
      if (usedCdn.current || tailwindReady()) schedule(true)
    })
  }, [schedule])

  useEffect(() => {
    if (settingsStore.get().autoSave) persist()
  }, [openTabs, active, folders, persist])

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify({ previewOpen, consoleOpen, panelLayout }))
    } catch {
      // Layout still applies for this session.
    }
  }, [previewOpen, consoleOpen, panelLayout])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const target = iframeRef.current?.contentWindow ?? externalPreviewWindow()
      if (!target || event.source !== target) return
      const data = event.data as { channel?: string; type?: string; level?: ConsoleLevel; args?: Ser[]; id?: number; ok?: boolean; value?: Ser }
      if (!data || data.channel !== 'rp') return
      if (data.type === 'console' && data.level && data.args) pushEntry(data.level, data.args)
      if (data.type === 'eval-result' && data.value) pushEntry(data.ok ? 'result' : 'error', [data.value], 'repl')
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [pushEntry])

  const getFiles = useCallback(() => filesRef.current, [])

  const onEdit = useCallback(
    (path: string, value: string) => {
      if (filesRef.current[path] === value) return
      filesRef.current[path] = value
      schedule()
      persist(path)
      editEvents.emit()
    },
    [persist, schedule],
  )

  const onMarkers = useCallback((next: Problem[]) => {
    setMarkers((prev) => (sameProblems(prev, next) ? prev : next))
  }, [])

  const openTab = useCallback((path: string) => {
    setOpenTabs((tabs) => withPinnedTabs(tabs.includes(path) ? tabs : [...tabs, path], Object.keys(filesRef.current)))
    setActive(path)
    statusStore.setLanguage(fileMeta(path).language)
  }, [])

  const closeTab = useCallback((path: string) => {
    setOpenTabs((tabs) => {
      const next = withPinnedTabs(
        tabs.filter((tab) => tab !== path),
        Object.keys(filesRef.current),
      )
      setActive((current) => {
        if (current !== path) return current
        const index = tabs.indexOf(path)
        return next[Math.max(0, index - 1)] ?? next[0]
      })
      return next
    })
  }, [])

  const createFile = useCallback(
    (name: string, open = true) => {
      if (filesRef.current[name] != null) return
      filesRef.current[name] = ''
      setPaths(Object.keys(filesRef.current))
      setFolders((prev) => uniqueFolders([...prev, ...parentFolders(name)]))
      if (!open) {
        persist(name)
        schedule(true)
        return
      }
      setOpenTabs((tabs) => withPinnedTabs([...tabs, name], Object.keys(filesRef.current)))
      setActive(name)
      setDialog(null)
      persist(name)
      schedule(true)
      requestAnimationFrame(() => editorRef.current?.reveal(name, 1, 1))
    },
    [persist, schedule],
  )

  const deleteFile = useCallback(
    (name: string) => {
      if (filesRef.current[name] == null) return
      delete filesRef.current[name]
      const nextPaths = Object.keys(filesRef.current)
      setPaths(nextPaths)
      setOpenTabs((tabs) => {
        const next = withPinnedTabs(
          tabs.filter((tab) => tab !== name),
          nextPaths,
        )
        setActive((current) => (current === name ? next[0] ?? 'index.html' : current))
        return next
      })
      editorRef.current?.setAll(filesRef.current, name === active ? 'index.html' : active)
      persist(name)
      schedule(true)
    },
    [active, persist, schedule],
  )

  const commitFiles = useCallback(
    (nextFiles: Record<string, string>, nextActive: string, nextTabs: string[]) => {
      filesRef.current = nextFiles
      const nextPaths = Object.keys(nextFiles)
      setPaths(nextPaths)
      const tabs = withPinnedTabs(nextTabs, nextPaths)
      const activePath = nextFiles[nextActive] != null ? nextActive : tabs[0] ?? 'index.html'
      setOpenTabs(tabs)
      setActive(activePath)
      editorRef.current?.setAll(nextFiles, activePath)
      persist('::structure')
      schedule(true)
      return activePath
    },
    [persist, schedule],
  )

  const createFolder = useCallback(
    (name: string) => {
      if (!isValidFolderName(name) || filesRef.current[name] != null) return
      setFolders((prev) => uniqueFolders([...prev, ...folderChain(name)]))
      setDialog(null)
      persist('::structure')
    },
    [persist],
  )

  const renameFile = useCallback(
    (from: string, to: string) => {
      if (!canRename(from) || !isValidFileName(to) || from === to || filesRef.current[to] != null) return
      const moves = new Map([[from, to]])
      const nextFiles = moveFiles(filesRef.current, moves)
      const nextTabs = tabsRef.current.map((tab) => moves.get(tab) ?? tab)
      const nextActive = moves.get(activeRef.current) ?? activeRef.current
      setFolders((prev) => uniqueFolders([...prev, ...parentFolders(to)]))
      commitFiles(nextFiles, nextActive, nextTabs)
      setDialog(null)
    },
    [commitFiles],
  )

  const renameFolder = useCallback(
    (from: string, to: string) => {
      if (!isValidFolderName(from) || !isValidFolderName(to) || from === to || to.startsWith(`${from}/`)) return
      const prefix = `${to}/`
      const blocked = Object.keys(filesRef.current).some((path) => (path === to || path.startsWith(prefix)) && !path.startsWith(`${from}/`))
      if (blocked || foldersRef.current.some((folder) => (folder === to || folder.startsWith(prefix)) && folder !== from && !folder.startsWith(`${from}/`))) return
      const moves = movesForPrefix(Object.keys(filesRef.current), from, to)
      const nextFiles = moves.size ? moveFiles(filesRef.current, moves) : filesRef.current
      const nextTabs = tabsRef.current.map((tab) => moves.get(tab) ?? tab)
      const nextActive = moves.get(activeRef.current) ?? activeRef.current
      setFolders((prev) => uniqueFolders(prev.map((folder) => (folder === from || folder.startsWith(`${from}/`) ? `${to}${folder.slice(from.length)}` : folder))))
      commitFiles(nextFiles, nextActive, nextTabs)
      setDialog(null)
    },
    [commitFiles],
  )

  const move = useCallback(
    (from: string, destFolder: string) => {
      const base = from.split('/').pop() ?? ''
      const to = destFolder ? `${destFolder}/${base}` : base
      if (!base || to === from) return
      if (filesRef.current[from] != null) {
        if (!canRename(from)) {
          statusStore.flash('Pinned files cannot be moved', 2500)
          return
        }
        if (!isValidFileName(to) || filesRef.current[to] != null || foldersRef.current.includes(to)) {
          statusStore.flash(`${to} already exists`, 2500)
          return
        }
        const moves = new Map([[from, to]])
        const nextFiles = moveFiles(filesRef.current, moves)
        const nextTabs = tabsRef.current.map((tab) => moves.get(tab) ?? tab)
        const nextActive = moves.get(activeRef.current) ?? activeRef.current
        setFolders((prev) => uniqueFolders([...prev, ...parentFolders(to)]))
        commitFiles(nextFiles, nextActive, nextTabs)
        statusStore.flash(`Moved ${from} to ${to}`)
        return
      }
      if (foldersRef.current.includes(from)) renameFolder(from, to)
    },
    [commitFiles, renameFolder],
  )

  const deleteFolder = useCallback(
    (folder: string) => {
      if (!isValidFolderName(folder)) return
      const prefix = `${folder}/`
      const nextFiles = { ...filesRef.current }
      for (const path of Object.keys(nextFiles)) {
        if (path.startsWith(prefix)) delete nextFiles[path]
      }
      filesRef.current = nextFiles
      setFolders((prev) => prev.filter((item) => item !== folder && !item.startsWith(prefix)))
      const nextTabs = tabsRef.current.filter((tab) => !tab.startsWith(prefix))
      const nextActive = activeRef.current.startsWith(prefix) ? 'index.html' : activeRef.current
      commitFiles(nextFiles, nextActive, nextTabs)
      setDialog(null)
    },
    [commitFiles],
  )

  const reset = useCallback(() => {
    clearProject(workspace)
    setUnsaved(new Set())
    setName(undefined)
    const fresh = WORKSPACES[workspace].defaults()
    filesRef.current = fresh.files
    const nextPaths = Object.keys(filesRef.current)
    setPaths(nextPaths)
    setFolders(fresh.folders)
    setOpenTabs(withPinnedTabs(fresh.openTabs, nextPaths))
    setActive(fresh.active)
    setEntries([])
    setBuildProblems([])
    setMarkers([])
    lastError.current = ''
    setDialog(null)
    editorRef.current?.setAll(filesRef.current, fresh.active)
    schedule(true)
  }, [schedule, workspace])

  const openProject = useCallback(
    (next: SavedProject) => {
      filesRef.current = { ...next.files }
      const nextPaths = Object.keys(filesRef.current)
      const nextFolders = uniqueFolders([...(next.folders ?? []), ...nextPaths.flatMap((path) => parentFolders(path))])
      const nextActive = next.files[next.active] != null ? next.active : nextPaths[0]
      const nextTabs = withPinnedTabs(next.openTabs, nextPaths)
      setPaths(nextPaths)
      setFolders(nextFolders)
      setOpenTabs(nextTabs)
      setActive(nextActive)
      setEntries([])
      setBuildProblems([])
      setMarkers([])
      setUnsaved(new Set())
      setName(next.name)
      lastError.current = ''
      setDialog(null)
      saveProject({ files: filesRef.current, openTabs: nextTabs, active: nextActive, folders: nextFolders, name: next.name }, workspace)
      editorRef.current?.setAll(filesRef.current, nextActive)
      schedule(true)
    },
    [schedule, workspace],
  )

  const loadImported = useCallback(
    (incoming: Incoming[], projectName: string) => {
      if (!incoming.length) return
      const nextFiles: Record<string, string> = {}
      for (const file of incoming) nextFiles[file.path] = file.text
      const info = WORKSPACES[workspace]
      const defaults = info.defaults().files
      for (const pinned of info.pinned) {
        if (nextFiles[pinned] == null) nextFiles[pinned] = defaults[pinned]
      }
      filesRef.current = nextFiles
      const nextPaths = Object.keys(nextFiles)
      const nextFolders = uniqueFolders(nextPaths.flatMap((path) => parentFolders(path)))
      const entry =
        nextPaths.find((path) => /(^|\/)main\.(tsx|jsx|ts|js)$/.test(path)) ??
        nextPaths.find((path) => /(^|\/)App\.(tsx|jsx|ts|js)$/.test(path)) ??
        nextPaths.find((path) => /\.(tsx|jsx|ts|js|html)$/.test(path)) ??
        nextPaths[0]
      const nextTabs = withPinnedTabs([entry], nextPaths)
      setPaths(nextPaths)
      setFolders(nextFolders)
      setOpenTabs(nextTabs)
      setActive(entry)
      setName(projectName)
      setEntries([])
      setBuildProblems([])
      setMarkers([])
      setUnsaved(new Set())
      lastError.current = ''
      setDialog(null)
      saveProject({ files: nextFiles, openTabs: nextTabs, active: entry, folders: nextFolders, name: projectName }, workspace)
      editorRef.current?.setAll(nextFiles, entry)
      schedule(true)
    },
    [schedule, workspace],
  )

  const run = useCallback(() => schedule(true), [schedule])

  const importFiles = useCallback(
    (incoming: Incoming[]) => {
      if (!incoming.length) return 0
      const nextFiles = { ...filesRef.current }
      for (const file of incoming) nextFiles[file.path] = file.text
      const first = incoming.find((file) => /\.(tsx|jsx|ts|js|html|css)$/.test(file.path))?.path ?? incoming[0].path
      setFolders((prev) => uniqueFolders([...prev, ...incoming.flatMap((file) => parentFolders(file.path))]))
      commitFiles(nextFiles, first, tabsRef.current.includes(first) ? tabsRef.current : [...tabsRef.current, first])
      return incoming.length
    },
    [commitFiles],
  )

  const format = useCallback(() => editorRef.current?.format(), [])

  const clearConsole = useCallback((source?: ConsoleEntry['source']) => {
    queue.current = source ? queue.current.filter((entry) => entry.source !== source) : []
    setEntries((prev) => (source ? prev.filter((entry) => entry.source !== source) : []))
  }, [])

  const evalInPreview = useCallback(
    (code: string) => {
      const trimmed = code.trim()
      if (!trimmed) return
      pushEntry('input', [{ t: 'string', v: trimmed }], 'repl')
      const id = evalId.current++
      const frameEl = iframeRef.current?.contentWindow ?? externalPreviewWindow()
      if (!frameEl) {
        pushEntry('error', [{ t: 'string', v: 'Preview is not ready yet.' }], 'repl')
        return
      }
      frameEl.postMessage({ channel: 'rp', type: 'eval', id, code: trimmed }, '*')
    },
    [pushEntry],
  )

  const revealProblem = useCallback((problem: Problem) => {
    if (!problem.file) return
    setOpenTabs((tabs) => withPinnedTabs(tabs.includes(problem.file!) ? tabs : [...tabs, problem.file!], Object.keys(filesRef.current)))
    setActive(problem.file)
    setMobilePane('code')
    requestAnimationFrame(() => editorRef.current?.reveal(problem.file!, problem.line ?? 1, problem.column ?? 1))
  }, [])

  const goTo = useCallback((path: string, line: number, column: number) => {
    if (filesRef.current[path] == null) return
    setOpenTabs((tabs) => withPinnedTabs(tabs.includes(path) ? tabs : [...tabs, path], Object.keys(filesRef.current)))
    setActive(path)
    setMobilePane('code')
    requestAnimationFrame(() => editorRef.current?.reveal(path, line, column))
  }, [])

  const replaceFile = useCallback((path: string, value: string) => {
    if (filesRef.current[path] == null || filesRef.current[path] === value) return
    editorRef.current?.replace(path, value)
  }, [])

  const problems = useMemo(() => [...buildProblems, ...markers], [buildProblems, markers])

  return {
    workspace,
    paths,
    folders,
    name,
    openTabs,
    active,
    setActive,
    sidebarOpen,
    setSidebarOpen,
    previewOpen,
    setPreviewOpen,
    consoleOpen,
    setConsoleOpen,
    consoleTab,
    setConsoleTab,
    previewHtml,
    entries,
    problems,
    device,
    setDevice,
    mobilePane,
    setMobilePane,
    paletteOpen,
    setPaletteOpen,
    dialog,
    setDialog,
    preserveLog,
    setPreserveLog,
    panelLayout,
    setPanelLayout,
    editorRef,
    iframeRef,
    getFiles,
    onEdit,
    onMarkers,
    openTab,
    closeTab,
    createFile,
    createFolder,
    renameFile,
    renameFolder,
    move,
    deleteFile,
    deleteFolder,
    reset,
    run,
    format,
    save,
    unsaved,
    savedAt,
    importFiles,
    loadImported,
    openProject,
    clearConsole,
    evalInPreview,
    revealProblem,
    goTo,
    replaceFile,
  }
}
