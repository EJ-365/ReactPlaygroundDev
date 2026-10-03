const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  avif: 'image/avif',
  svg: 'image/svg+xml',
}

export function imageMime(path: string) {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

const DATA_URL_RE = /^data:([^;,]*)?(;base64)?,([\s\S]*)$/s

export function isDataUrl(text: string | undefined) {
  return Boolean(text && DATA_URL_RE.test(text))
}

export function dataUrlMime(text: string, fallback = 'application/octet-stream') {
  const match = DATA_URL_RE.exec(text)
  return match?.[1] || fallback
}

export function dataUrlBytes(text: string) {
  const match = DATA_URL_RE.exec(text)
  if (!match) return undefined
  if (match[2]) {
    const binary = atob(match[3])
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  }
  return new TextEncoder().encode(decodeURIComponent(match[3]))
}

export function textToSvgDataUrl(source: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
}
