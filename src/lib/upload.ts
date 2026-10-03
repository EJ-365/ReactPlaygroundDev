import { isImageFile, isValidFileName } from './files'
import { fileToDataUrl } from './media'

export type Incoming = { path: string; text: string }
export type UploadResult = { files: Incoming[]; skipped: string[]; root?: string }

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.vite', 'coverage', '.cache'])
const MAX_BYTES = 250_000
const MAX_IMAGE_BYTES = 1_500_000
const MAX_FILES = 400

function cleanPath(raw: string) {
  return raw
    .replace(/\\/g, '/')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .map((part) => part.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, ''))
    .filter(Boolean)
    .join('/')
}

function skippedDir(path: string) {
  return path.split('/').slice(0, -1).some((part) => SKIP_DIRS.has(part))
}

async function collect(entries: { path: string; file: File }[], root?: string): Promise<UploadResult> {
  const files: Incoming[] = []
  const skipped: string[] = []
  for (const { path, file } of entries) {
    let clean = cleanPath(path)
    if (root && (clean === root || clean.startsWith(`${root}/`))) clean = clean.slice(root.length + 1)
    if (!clean || skippedDir(clean)) continue
    const image = isImageFile(clean)
    if (!isValidFileName(clean) || file.size > (image ? MAX_IMAGE_BYTES : MAX_BYTES) || files.length >= MAX_FILES) {
      skipped.push(path)
      continue
    }
    files.push({ path: clean, text: image ? await fileToDataUrl(file) : await file.text() })
  }
  return { files, skipped, root: files.length ? root : undefined }
}

function sharedRoot(paths: string[]) {
  if (!paths.length) return undefined
  const first = cleanPath(paths[0]).split('/')[0]
  if (!first) return undefined
  for (const raw of paths) {
    const parts = cleanPath(raw).split('/')
    if (parts.length < 2 || parts[0] !== first) return undefined
  }
  return first
}

export function fromFileList(list: FileList | File[]) {
  const entries = Array.from(list).map((file) => ({ path: file.webkitRelativePath || file.name, file }))
  const nested = entries.filter((entry) => entry.path.includes('/'))
  const root = nested.length === entries.length ? sharedRoot(entries.map((entry) => entry.path)) : undefined
  return collect(entries, root)
}

function readAll(reader: FileSystemDirectoryReader) {
  return new Promise<FileSystemEntry[]>((resolve, reject) => {
    const all: FileSystemEntry[] = []
    const next = () =>
      reader.readEntries((batch) => {
        if (!batch.length) resolve(all)
        else {
          all.push(...batch)
          next()
        }
      }, reject)
    next()
  })
}

function fileOf(entry: FileSystemFileEntry) {
  return new Promise<File>((resolve, reject) => entry.file(resolve, reject))
}

async function walk(entry: FileSystemEntry, out: { path: string; file: File }[]) {
  if (entry.isFile) {
    out.push({ path: entry.fullPath.replace(/^\//, ''), file: await fileOf(entry as FileSystemFileEntry) })
    return
  }
  if (!entry.isDirectory || SKIP_DIRS.has(entry.name)) return
  const children = await readAll((entry as FileSystemDirectoryEntry).createReader())
  for (const child of children) await walk(child, out)
}

export async function fromDataTransfer(data: DataTransfer) {
  const roots = Array.from(data.items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => entry !== null)
  if (!roots.length) return fromFileList(data.files)
  const single = roots.length === 1 && roots[0].isDirectory ? cleanPath(roots[0].name) : undefined
  const out: { path: string; file: File }[] = []
  for (const root of roots) await walk(root, out)
  return collect(out, single ?? sharedRoot(out.map((entry) => entry.path)))
}
