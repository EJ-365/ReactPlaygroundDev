const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let crc = n
    for (let k = 0; k < 8; k += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    table[n] = crc >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function u16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function u32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

export function zipStore(files: { name: string; text?: string; bytes?: Uint8Array }[]) {
  const encoder = new TextEncoder()
  const entries = files.map((file) => {
    const name = encoder.encode(file.name.replace(/\\/g, '/'))
    const data = file.bytes ?? encoder.encode(file.text ?? '')
    return { name, data, crc: crc32(data) }
  })
  const localSize = entries.reduce((sum, entry) => sum + 30 + entry.name.length + entry.data.length, 0)
  const centralSize = entries.reduce((sum, entry) => sum + 46 + entry.name.length, 0)
  const out = new Uint8Array(localSize + centralSize + 22)
  const view = new DataView(out.buffer)
  let offset = 0
  const locals: number[] = []
  for (const entry of entries) {
    locals.push(offset)
    u32(view, offset, 0x04034b50)
    u16(view, offset + 4, 20)
    u16(view, offset + 6, 0x0800)
    u16(view, offset + 8, 0)
    u16(view, offset + 10, 0)
    u16(view, offset + 12, 0)
    u32(view, offset + 14, entry.crc)
    u32(view, offset + 18, entry.data.length)
    u32(view, offset + 22, entry.data.length)
    u16(view, offset + 26, entry.name.length)
    u16(view, offset + 28, 0)
    out.set(entry.name, offset + 30)
    out.set(entry.data, offset + 30 + entry.name.length)
    offset += 30 + entry.name.length + entry.data.length
  }
  const centralStart = offset
  entries.forEach((entry, index) => {
    u32(view, offset, 0x02014b50)
    u16(view, offset + 4, 20)
    u16(view, offset + 6, 20)
    u16(view, offset + 8, 0x0800)
    u16(view, offset + 10, 0)
    u16(view, offset + 12, 0)
    u16(view, offset + 14, 0)
    u32(view, offset + 16, entry.crc)
    u32(view, offset + 20, entry.data.length)
    u32(view, offset + 24, entry.data.length)
    u16(view, offset + 28, entry.name.length)
    u16(view, offset + 30, 0)
    u16(view, offset + 32, 0)
    u16(view, offset + 34, 0)
    u16(view, offset + 36, 0)
    u32(view, offset + 38, 0)
    u32(view, offset + 42, locals[index])
    out.set(entry.name, offset + 46)
    offset += 46 + entry.name.length
  })
  u32(view, offset, 0x06054b50)
  u16(view, offset + 8, entries.length)
  u16(view, offset + 10, entries.length)
  u32(view, offset + 12, offset - centralStart)
  u32(view, offset + 16, centralStart)
  return new Blob([out], { type: 'application/zip' })
}
