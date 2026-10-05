import { CPP_PROJECT, CSHARP_PROJECT, DEFAULT_ACTIVE, DEFAULT_FILES, DEFAULT_TABS, GO_PROJECT, JAVA_PROJECT, PY_PROJECT, RUST_PROJECT, TS_ACTIVE, TS_FILES, TS_TABS, WEB_ACTIVE, WEB_FILES, WEB_TABS } from '../defaults'

export const WORKSPACE_IDS = ['web', 'ts', 'react', 'python', 'cpp', 'java', 'csharp', 'go', 'rust'] as const
export type WorkspaceId = (typeof WORKSPACE_IDS)[number]

export type WorkspaceInfo = {
  id: WorkspaceId
  label: string
  short: string
  status: string
  root: string
  storageKey: string
  /** 'web' is driven by index.html, 'script' bundles a TS entry, 'python' runs via Pyodide, 'lang' is edit-only, 'react' bundles an entry module. */
  kind: 'web' | 'script' | 'python' | 'lang' | 'react'
  /** The file announced by the "Running …" console message. */
  entry: string
  /** The script file auto-linked into index.html when nothing is referenced (web workspaces). */
  script?: string
  /** Wandbox compiler id for remote execution ('lang' workspaces). */
  runner?: string
  pinned: readonly string[]
  defaults: () => { files: Record<string, string>; openTabs: string[]; active: string; folders: string[] }
}

export const WORKSPACES: Record<WorkspaceId, WorkspaceInfo> = {
  web: {
    id: 'web',
    label: 'HTML · CSS · JS',
    short: 'Web',
    status: 'HTML · CSS · JS',
    root: 'web-project',
    storageKey: 'react-playground.web.v1',
    kind: 'web',
    entry: 'index.html',
    script: 'script.js',
    pinned: ['index.html', 'styles.css', 'script.js'],
    defaults: () => ({ files: { ...WEB_FILES }, openTabs: [...WEB_TABS], active: WEB_ACTIVE, folders: [] }),
  },
  ts: {
    id: 'ts',
    label: 'TypeScript',
    short: 'TS',
    status: 'TypeScript',
    root: 'ts-playground',
    storageKey: 'react-playground.ts.v1',
    kind: 'script',
    entry: 'main.ts',
    pinned: ['main.ts'],
    defaults: () => ({ files: { ...TS_FILES }, openTabs: [...TS_TABS], active: TS_ACTIVE, folders: [] }),
  },
  react: {
    id: 'react',
    label: 'React',
    short: 'React',
    status: 'React · Vite',
    root: 'react-app',
    storageKey: 'react-playground.v1',
    kind: 'react',
    entry: 'main.tsx',
    pinned: ['index.html', 'styles.css'],
    defaults: () => ({ files: { ...DEFAULT_FILES }, openTabs: [...DEFAULT_TABS], active: DEFAULT_ACTIVE, folders: ['components'] }),
  },
  python: {
    id: 'python',
    label: 'Python',
    short: 'Py',
    status: 'Python (Pyodide)',
    root: 'python-project',
    storageKey: 'react-playground.python.v1',
    kind: 'python',
    entry: 'main.py',
    pinned: ['main.py'],
    defaults: PY_PROJECT,
  },
  cpp: {
    id: 'cpp',
    label: 'C++',
    short: 'C++',
    status: 'C++',
    root: 'cpp-project',
    storageKey: 'react-playground.cpp.v1',
    kind: 'lang',
    runner: 'gcc-13.2.0',
    entry: 'main.cpp',
    pinned: ['main.cpp'],
    defaults: CPP_PROJECT,
  },
  java: {
    id: 'java',
    label: 'Java',
    short: 'Java',
    status: 'Java',
    root: 'java-project',
    storageKey: 'react-playground.java.v1',
    kind: 'lang',
    runner: 'openjdk-jdk-22+36',
    entry: 'Main.java',
    pinned: ['Main.java'],
    defaults: JAVA_PROJECT,
  },
  csharp: {
    id: 'csharp',
    label: 'C#',
    short: 'C#',
    status: 'C#',
    root: 'csharp-project',
    storageKey: 'react-playground.csharp.v1',
    kind: 'lang',
    runner: 'mono-6.12.0.199',
    entry: 'Program.cs',
    pinned: ['Program.cs'],
    defaults: CSHARP_PROJECT,
  },
  go: {
    id: 'go',
    label: 'Go',
    short: 'Go',
    status: 'Go',
    root: 'go-project',
    storageKey: 'react-playground.go.v1',
    kind: 'lang',
    runner: 'go-1.23.2',
    entry: 'main.go',
    pinned: ['main.go'],
    defaults: GO_PROJECT,
  },
  rust: {
    id: 'rust',
    label: 'Rust',
    short: 'Rust',
    status: 'Rust',
    root: 'rust-project',
    storageKey: 'react-playground.rust.v1',
    kind: 'lang',
    runner: 'rust-1.82.0',
    entry: 'main.rs',
    pinned: ['main.rs'],
    defaults: RUST_PROJECT,
  },
}

const KEY = 'react-playground.workspace'
const listeners = new Set<() => void>()

export function isWorkspaceId(value: unknown): value is WorkspaceId {
  return typeof value === 'string' && (WORKSPACE_IDS as readonly string[]).includes(value)
}

function read(): WorkspaceId {
  try {
    const saved = localStorage.getItem(KEY)
    return isWorkspaceId(saved) ? saved : 'react'
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
