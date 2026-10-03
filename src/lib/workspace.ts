import { DEFAULT_ACTIVE, DEFAULT_FILES, DEFAULT_TABS, WEB_ACTIVE, WEB_FILES, WEB_TABS } from '../defaults'

export type WorkspaceId = 'web' | 'react'

export type WorkspaceInfo = {
  id: WorkspaceId
  label: string
  short: string
  root: string
  storageKey: string
  pinned: readonly string[]
  defaults: () => { files: Record<string, string>; openTabs: string[]; active: string; folders: string[] }
}

export const WORKSPACES: Record<WorkspaceId, WorkspaceInfo> = {
  web: {
    id: 'web',
    label: 'HTML · CSS · JS',
    short: 'Web',
    root: 'web-project',
    storageKey: 'react-playground.web.v1',
    pinned: ['index.html', 'styles.css', 'script.js'],
    defaults: () => ({ files: { ...WEB_FILES }, openTabs: [...WEB_TABS], active: WEB_ACTIVE, folders: [] }),
  },
  react: {
    id: 'react',
    label: 'React',
    short: 'React',
    root: 'react-app',
    storageKey: 'react-playground.v1',
    pinned: ['index.html', 'styles.css'],
    defaults: () => ({ files: { ...DEFAULT_FILES }, openTabs: [...DEFAULT_TABS], active: DEFAULT_ACTIVE, folders: ['components'] }),
  },
}

const KEY = 'react-playground.workspace'
const listeners = new Set<() => void>()

function read(): WorkspaceId {
  try {
    return localStorage.getItem(KEY) === 'web' ? 'web' : 'react'
  } catch {
    return 'react'
  }
}

let current = read()

export const workspaceStore = {
  get: () => current,
  info: () => WORKSPACES[current],
  set(next: WorkspaceId) {
    if (next === current) return
    current = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // The choice still applies for this session.
    }
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
