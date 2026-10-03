import { isValidFileName } from './files'

export type Incoming = { path: string; text: string }
export type UploadResult = { files: Incoming[]; skipped: string[] }

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.vite', 'coverage', '.cache'])
const MAX_BYTES = 250_000
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

async function collect(entries: { path: string; file: File }[]): Promise<UploadResult> {
  const files: Incoming[] = []
  const skipped: string[] = []
  for (const { path, file } of entries) {
    const clean = cleanPath(path)
    if (!clean || skippedDir(clean)) continue
    if (!isValidFileName(clean) || file.size > MAX_BYTES || files.length >= MAX_FILES) {
      skipped.push(path)
      continue
    }
    files.push({ path: clean, text: await file.text() })
  }
  return { files, skipped }
}

export function fromFileList(list: FileList | File[]) {
  return collect(Array.from(list).map((file) => ({ path: file.webkitRelativePath || file.name, file })))
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
  const out: { path: string; file: File }[] = []
  for (const root of roots) await walk(root, out)
  return collect(out)
}
