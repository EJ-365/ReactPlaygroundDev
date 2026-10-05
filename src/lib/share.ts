import { isValidFileName, isValidFolderName } from './files'
import { loadProject, saveProject, type SavedProject } from './storage'
import { isWorkspaceId, WORKSPACES, workspaceStore, type WorkspaceId } from './workspace'

const PREFIX = '#code/'

type SharedPayload = { files: Record<string, string>; active?: string; folders?: string[]; workspace?: WorkspaceId }

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const output = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(output).arrayBuffer())
}

export async function createShareUrl(payload: SharedPayload) {
  const json = new TextEncoder().encode(JSON.stringify(payload))
  const packed = await pipe(json, new CompressionStream('deflate-raw'))
  return `${location.origin}${location.pathname}${PREFIX}${toBase64Url(packed)}`
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    const copied = document.execCommand('copy')
    area.remove()
    return copied
  }
}

async function readShared(hash: string): Promise<{ project: SavedProject; workspace: WorkspaceId } | null> {
  const bytes = await pipe(fromBase64Url(hash.slice(PREFIX.length)), new DecompressionStream('deflate-raw'))
  const data = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SharedPayload>
  if (!data.files || typeof data.files !== 'object') return null
  const files: Record<string, string> = {}
  for (const [name, value] of Object.entries(data.files)) {
    if (typeof value === 'string' && isValidFileName(name)) files[name] = value
  }
  const paths = Object.keys(files)
  if (!paths.length) return null
  const workspace: WorkspaceId = isWorkspaceId(data.workspace) ? data.workspace : 'react'
  const fallback = WORKSPACES[workspace].defaults().active
  const active = typeof data.active === 'string' && files[data.active] != null ? data.active : files[fallback] != null ? fallback : paths[0]
  const folders = Array.isArray(data.folders) ? data.folders.filter((folder): folder is string => typeof folder === 'string' && isValidFolderName(folder)) : []
  return { project: { files, openTabs: [active], active, folders }, workspace }
}

export async function importSharedProject() {
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith(PREFIX)) location.reload()
  })
  if (!location.hash.startsWith(PREFIX)) return
  try {
    const shared = await readShared(location.hash)
    if (shared) {
      const hasLocal = loadProject(shared.workspace) !== null
      const label = WORKSPACES[shared.workspace].label
      if (!hasLocal || window.confirm(`Open the shared project? It replaces your ${label} project saved in this browser.`)) {
        saveProject(shared.project, shared.workspace)
        workspaceStore.set(shared.workspace)
      }
    }
  } catch (error) {
    console.warn('Could not open the shared project link', error)
  }
  history.replaceState(null, '', `${location.pathname}${location.search}#/app`)
}
