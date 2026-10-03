import { DEFAULT_FILES } from '../defaults'
import { isValidFileName, isValidFolderName, withPinnedTabs } from './files'
import { WORKSPACES, workspaceStore, type WorkspaceId } from './workspace'

export type SavedProject = {
  files: Record<string, string>
  openTabs: string[]
  active: string
  folders: string[]
}

const LEGACY_MAIN = `import { createRoot } from 'react-dom/client'
import App from './App'

const root = document.getElementById('root')

if (!root) {
  console.error('index.html needs an element with id="root".')
} else {
  createRoot(root).render(<App />)
}
`

const LEGACY_HTML = `<div id="root"></div>
<footer class="px-6 pb-8 text-center text-[11px] text-slate-500">
  HTML tab · rendered outside the React root
</footer>
`

const LEGACY_FOOTER = /[ \t]*<footer\b[^>]*>\s*HTML tab · rendered outside the React root\s*<\/footer>[ \t]*\r?\n?/g

const LEGACY_SCRIPT = `const footer = document.querySelector('footer')
console.log('script.js ran after React. Footer found:', Boolean(footer))
console.info('Evaluate the preview from the console input below.')
`

const LEGACY_REACT_SCRIPT = `// Plain JavaScript that runs after React mounts.
console.log('script.js ran after React. Root found:', Boolean(document.getElementById('root')))
console.info('Evaluate the preview from the console input below.')
`

function linkWebFiles(html: string, files: Record<string, string>) {
  const local = /<(?:link\b[^>]*\bhref|script\b[^>]*\bsrc)\s*=\s*["'](?![a-z][\w+.-]*:|\/\/)[^"']+["']/i
  if (local.test(html)) return html
  let next = html
  if ('styles.css' in files) {
    const link = '<link rel="stylesheet" href="styles.css" />'
    next = /<\/head>/i.test(next) ? next.replace(/<\/head>/i, `  ${link}\n  </head>`) : `${link}\n${next}`
  }
  if (files['script.js']?.trim()) {
    const module = /^\s*(import|export)\s/m.test(files['script.js']) ? ' type="module"' : ''
    const script = `<script${module} src="script.js"></script>`
    next = /<\/body>/i.test(next) ? next.replace(/<\/body>/i, `  ${script}\n  </body>`) : `${next.replace(/\s*$/, '')}\n${script}\n`
  }
  return next
}

function sanitize(files: Record<string, unknown>, workspace: WorkspaceId) {
  const next: Record<string, string> = {}
  for (const [name, value] of Object.entries(files)) {
    if (typeof value === 'string' && isValidFileName(name) && value.length < 250_000) next[name] = value
  }
  const defaults = WORKSPACES[workspace].defaults().files
  for (const name of WORKSPACES[workspace].pinned) {
    if (typeof next[name] !== 'string') next[name] = defaults[name]
  }
  if (next['main.tsx'] === LEGACY_MAIN) next['main.tsx'] = DEFAULT_FILES['main.tsx']
  if (next['index.html'] === LEGACY_HTML) next['index.html'] = DEFAULT_FILES['index.html']
  next['index.html'] = next['index.html'].replace(LEGACY_FOOTER, '')
  if (workspace === 'web') next['index.html'] = linkWebFiles(next['index.html'], next)
  if (workspace === 'react' && (next['script.js'] === LEGACY_SCRIPT || next['script.js'] === LEGACY_REACT_SCRIPT)) delete next['script.js']
  return next
}

export function loadProject(workspace: WorkspaceId = workspaceStore.get()): SavedProject | null {
  try {
    const info = WORKSPACES[workspace]
    const raw = localStorage.getItem(info.storageKey)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<SavedProject> & { version?: number }
    if (data.version !== 1 || !data.files || typeof data.files !== 'object') return null
    const files = sanitize(data.files as Record<string, unknown>, workspace)
    const fallback = info.defaults()
    const paths = Object.keys(files)
    const openTabs = withPinnedTabs(Array.isArray(data.openTabs) ? data.openTabs.filter((tab) => typeof tab === 'string') : fallback.openTabs, paths, info.pinned)
    const active = typeof data.active === 'string' && files[data.active] != null ? data.active : openTabs[0] ?? fallback.active
    const folders = Array.isArray(data.folders) ? data.folders.filter((folder): folder is string => typeof folder === 'string' && isValidFolderName(folder)) : []
    return { files, openTabs, active, folders }
  } catch {
    return null
  }
}

export function saveProject(project: SavedProject, workspace: WorkspaceId = workspaceStore.get()) {
  try {
    localStorage.setItem(WORKSPACES[workspace].storageKey, JSON.stringify({ version: 1, ...project }))
  } catch {
    // Ignore quota and private-mode failures. The session still runs.
  }
}

export function clearProject(workspace: WorkspaceId = workspaceStore.get()) {
  localStorage.removeItem(WORKSPACES[workspace].storageKey)
}
