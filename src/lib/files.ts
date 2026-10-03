import { workspaceStore } from './workspace'

export const TEXT_EXTENSIONS = ['tsx', 'ts', 'jsx', 'js', 'mjs', 'cjs', 'css', 'scss', 'sass', 'less', 'html', 'htm', 'json', 'md', 'mdx', 'txt', 'svg', 'xml', 'yml', 'yaml', 'vue', 'svelte', 'py', 'c', 'h', 'cpp', 'cc', 'cxx', 'c++', 'hpp', 'hh', 'hxx', 'cs', 'java', 'go', 'rs', 'php', 'rb', 'sh', 'sql', 'graphql'] as const
const FILE_RE = new RegExp(`^(?:[A-Za-z0-9._-]+\\/)*[A-Za-z0-9._-]+\\.(${TEXT_EXTENSIONS.map((ext) => ext.replace(/\+/g, '\\+')).join('|')})$`)

const MONACO_LANGUAGES: Record<string, [string, string]> = {
  mjs: ['JavaScript', 'javascript'],
  cjs: ['JavaScript', 'javascript'],
  scss: ['SCSS', 'scss'],
  sass: ['Sass', 'scss'],
  less: ['Less', 'less'],
  htm: ['HTML', 'html'],
  json: ['JSON', 'json'],
  md: ['Markdown', 'markdown'],
  mdx: ['MDX', 'markdown'],
  svg: ['SVG', 'xml'],
  xml: ['XML', 'xml'],
  yml: ['YAML', 'yaml'],
  yaml: ['YAML', 'yaml'],
  vue: ['Vue', 'html'],
  svelte: ['Svelte', 'html'],
  py: ['Python', 'python'],
  c: ['C', 'cpp'],
  h: ['C', 'cpp'],
  cpp: ['C++', 'cpp'],
  cc: ['C++', 'cpp'],
  hpp: ['C++', 'cpp'],
  cxx: ['C++', 'cpp'],
  'c++': ['C++', 'cpp'],
  hh: ['C++', 'cpp'],
  hxx: ['C++', 'cpp'],
  cs: ['C#', 'csharp'],
  java: ['Java', 'java'],
  go: ['Go', 'go'],
  rs: ['Rust', 'rust'],
  php: ['PHP', 'php'],
  rb: ['Ruby', 'ruby'],
  sh: ['Shell', 'shell'],
  sql: ['SQL', 'sql'],
  graphql: ['GraphQL', 'graphql'],
}
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json']

export function isDocFile(path: string) {
  return workspaceStore.info().pinned.includes(path)
}

export function fileMeta(name: string) {
  if (name.endsWith('.tsx')) return { language: 'TypeScript React', monaco: 'typescript', label: 'TSX', color: '#2dd4bf' }
  if (name.endsWith('.ts')) return { language: 'TypeScript', monaco: 'typescript', label: 'TS', color: '#60a5fa' }
  if (name.endsWith('.jsx')) return { language: 'JavaScript React', monaco: 'javascript', label: 'JSX', color: '#22d3ee' }
  if (name.endsWith('.js')) return { language: 'JavaScript', monaco: 'javascript', label: 'JS', color: '#f5d76e' }
  if (name.endsWith('.css')) return { language: 'CSS', monaco: 'css', label: 'CSS', color: '#7cb7ff' }
  if (name.endsWith('.html')) return { language: 'HTML', monaco: 'html', label: 'HTML', color: '#f0924a' }
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  const known = MONACO_LANGUAGES[ext]
  if (known) return { language: known[0], monaco: known[1], label: ext.toUpperCase(), color: '#94a3b8' }
  return { language: 'Plain text', monaco: 'plaintext', label: 'TXT', color: '#94a3b8' }
}

export function normalizeFileName(raw: string) {
  let name = raw.trim().replace(/\\/g, '/').replace(/^\/+/, '')
  if (!name) return ''
  if (!/\.[a-z0-9]+$/i.test(name)) name += '.tsx'
  return name
}

const FOLDER_RE = /^(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+$/

export function isValidFileName(name: string) {
  return FILE_RE.test(name) && !name.split('/').includes('..')
}

export function canRename(path: string) {
  return !isDocFile(path) && path !== 'tailwind.config.js'
}

export function normalizeFolderName(raw: string) {
  return raw.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
}

export function isValidFolderName(name: string) {
  if (!FOLDER_RE.test(name) || name.split('/').includes('..')) return false
  return name.split('/').every((part) => part !== '.' && part !== '')
}

export function folderChain(path: string) {
  const parts = path.split('/').filter(Boolean)
  const chain: string[] = []
  for (let index = 0; index < parts.length; index += 1) chain.push(parts.slice(0, index + 1).join('/'))
  return chain
}

export function parentFolders(filePath: string) {
  const parts = filePath.split('/')
  if (parts.length < 2) return []
  return folderChain(parts.slice(0, -1).join('/'))
}

export function uniqueFolders(folders: string[]) {
  return [...new Set(folders.filter((folder) => isValidFolderName(folder)))].sort((a, b) => a.localeCompare(b))
}

export function componentName(path: string) {
  const base = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'Component'
  const cleaned = base.replace(/[^A-Za-z0-9]/g, '')
  const pascal = cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'Component'
  return /^[A-Za-z]/.test(pascal) ? pascal : `File${pascal}`
}

export function normalizePath(path: string) {
  const parts: string[] = []
  for (const part of path.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

export function resolveImport(importer: string, spec: string, has: (path: string) => boolean) {
  if (!spec.startsWith('.')) return null
  const dir = importer.includes('/') ? importer.slice(0, importer.lastIndexOf('/')) : ''
  const raw = normalizePath(`${dir}/${spec}`)
  const candidates = [raw]
  const hasExt = EXTENSIONS.some((ext) => raw.endsWith(ext))
  if (!hasExt) {
    for (const ext of EXTENSIONS) candidates.push(raw + ext)
    for (const ext of EXTENSIONS) candidates.push(`${raw}/index${ext}`)
  }
  return candidates.find((candidate) => has(candidate)) ?? null
}

export type TreeNode =
  | { kind: 'file'; name: string; path: string }
  | { kind: 'folder'; name: string; path: string; children: TreeNode[] }

export function relativeImport(fromFile: string, toFile: string) {
  const fromDir = fromFile.split('/').slice(0, -1)
  const toParts = toFile.replace(/\.(tsx|ts|jsx|js|css)$/, '').split('/')
  let index = 0
  while (index < fromDir.length && fromDir[index] === toParts[index]) index += 1
  const up = Array.from({ length: fromDir.length - index }, () => '..')
  const rel = [...up, ...toParts.slice(index)].join('/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

function specifierFor(fromFile: string, toFile: string, original: string) {
  const rel = relativeImport(fromFile, toFile)
  if (/\.(tsx|ts|jsx|js|css)$/.test(original)) {
    const ext = toFile.match(/\.(tsx|ts|jsx|js|css)$/)?.[0] ?? ''
    return `${rel}${ext}`
  }
  return rel
}

const SPEC_RE = /(from\s+|import\s*\(\s*|import\s+)(['"])(\.[^'"]+)\2/g

export function moveFiles(files: Record<string, string>, moves: Map<string, string>) {
  const has = (path: string) => Object.prototype.hasOwnProperty.call(files, path)
  const next: Record<string, string> = {}
  for (const [path, source] of Object.entries(files)) {
    const dest = moves.get(path) ?? path
    next[dest] = source.replace(SPEC_RE, (full, lead: string, quote: string, spec: string) => {
      const resolved = resolveImport(path, spec, has)
      if (!resolved) return full
      const target = moves.get(resolved) ?? resolved
      if (target === resolved && dest === path) return full
      return `${lead}${quote}${specifierFor(dest, target, spec)}${quote}`
    })
  }
  return next
}

export function movesForPrefix(paths: string[], from: string, to: string) {
  const moves = new Map<string, string>()
  const prefix = `${from}/`
  for (const path of paths) {
    if (path.startsWith(prefix)) moves.set(path, `${to}${path.slice(from.length)}`)
  }
  return moves
}

export function fileTree(paths: string[], extraFolders: string[] = []): TreeNode[] {
  const root: TreeNode[] = []
  const folders = new Map<string, TreeNode & { kind: 'folder' }>()

  const ensureFolder = (folderPath: string) => {
    const parts = folderPath.split('/')
    let list = root
    let acc = ''
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part
      let folder = folders.get(acc)
      if (!folder) {
        folder = { kind: 'folder', name: part, path: acc, children: [] }
        folders.set(acc, folder)
        list.push(folder)
      }
      list = folder.children
    }
  }

  for (const folderPath of extraFolders) {
    if (isValidFolderName(folderPath)) ensureFolder(folderPath)
  }

  for (const path of [...paths].sort((a, b) => a.localeCompare(b))) {
    const parts = path.split('/')
    let list = root
    let acc = ''
    parts.forEach((part, index) => {
      acc = acc ? `${acc}/${part}` : part
      if (index === parts.length - 1) {
        list.push({ kind: 'file', name: part, path })
        return
      }
      let folder = folders.get(acc)
      if (!folder) {
        folder = { kind: 'folder', name: part, path: acc, children: [] }
        folders.set(acc, folder)
        list.push(folder)
      }
      list = folder.children
    })
  }
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    for (const node of nodes) if (node.kind === 'folder') sortNodes(node.children)
  }
  sortNodes(root)
  return root
}

export function withPinnedTabs(tabs: string[], paths: string[], pinned: readonly string[] = workspaceStore.info().pinned) {
  const pins = pinned.filter((path) => paths.includes(path))
  const pinnedSet = new Set<string>(pins)
  const rest = tabs.filter((path) => !pinnedSet.has(path) && paths.includes(path))
  return [...pins, ...rest]
}
