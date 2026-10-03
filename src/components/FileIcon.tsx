type Props = { path: string; size?: number; className?: string }

type Badge = { text: string; bg: string; fg: string }

const BADGES: Record<string, Badge> = {
  ts: { text: 'TS', bg: '#3178c6', fg: '#ffffff' },
  mts: { text: 'TS', bg: '#3178c6', fg: '#ffffff' },
  js: { text: 'JS', bg: '#f7df1e', fg: '#1b1b1b' },
  mjs: { text: 'JS', bg: '#f7df1e', fg: '#1b1b1b' },
  cjs: { text: 'JS', bg: '#f7df1e', fg: '#1b1b1b' },
  md: { text: 'M↓', bg: '#42a5f5', fg: '#0b1a2a' },
  py: { text: 'Py', bg: '#3776ab', fg: '#ffd43b' },
  c: { text: 'C', bg: '#283593', fg: '#ffffff' },
  h: { text: 'H', bg: '#5c6bc0', fg: '#ffffff' },
  cpp: { text: 'C++', bg: '#00599c', fg: '#ffffff' },
  cc: { text: 'C++', bg: '#00599c', fg: '#ffffff' },
  hpp: { text: 'H++', bg: '#00599c', fg: '#ffffff' },
  cxx: { text: 'C++', bg: '#00599c', fg: '#ffffff' },
  'c++': { text: 'C++', bg: '#00599c', fg: '#ffffff' },
  hh: { text: 'H++', bg: '#00599c', fg: '#ffffff' },
  hxx: { text: 'H++', bg: '#00599c', fg: '#ffffff' },
  cs: { text: 'C#', bg: '#68217a', fg: '#ffffff' },
  java: { text: 'J', bg: '#e76f00', fg: '#ffffff' },
  go: { text: 'Go', bg: '#00add8', fg: '#ffffff' },
  rs: { text: 'Rs', bg: '#dea584', fg: '#1b1b1b' },
  php: { text: 'php', bg: '#777bb4', fg: '#ffffff' },
  rb: { text: 'Rb', bg: '#cc342d', fg: '#ffffff' },
  vue: { text: 'V', bg: '#41b883', fg: '#35495e' },
  svelte: { text: 'S', bg: '#ff3e00', fg: '#ffffff' },
  scss: { text: 'S', bg: '#cd6799', fg: '#ffffff' },
  sass: { text: 'S', bg: '#cd6799', fg: '#ffffff' },
  less: { text: 'L', bg: '#1d365d', fg: '#ffffff' },
  sh: { text: '$', bg: '#4eaa25', fg: '#ffffff' },
  yml: { text: 'Y', bg: '#cb171e', fg: '#ffffff' },
  yaml: { text: 'Y', bg: '#cb171e', fg: '#ffffff' },
  txt: { text: 'T', bg: '#64748b', fg: '#ffffff' },
}

export function extensionOf(path: string) {
  const name = path.split('/').pop() ?? path
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

function ReactAtom({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="1.1">
      <ellipse cx="8" cy="8" rx="7" ry="2.7" />
      <ellipse cx="8" cy="8" rx="7" ry="2.7" transform="rotate(60 8 8)" />
      <ellipse cx="8" cy="8" rx="7" ry="2.7" transform="rotate(120 8 8)" />
      <circle cx="8" cy="8" r="1.45" fill={color} stroke="none" />
    </g>
  )
}

function Shield({ color, mark }: { color: string; mark: string }) {
  return (
    <g>
      <path d="M2 1h12l-1.1 12.3L8 15l-4.9-1.7z" fill={color} />
      <path d="M8 2.1v11.7l3.95-1.4.93-10.3z" fill="#ffffff" opacity="0.18" />
      <text x="8" y="10.6" textAnchor="middle" fontSize="7.4" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#ffffff">{mark}</text>
    </g>
  )
}

function Glyph({ ext }: { ext: string }) {
  if (ext === 'tsx') return <ReactAtom color="#4fa6ff" />
  if (ext === 'jsx') return <ReactAtom color="#61dafb" />
  if (ext === 'html' || ext === 'htm') return <Shield color="#e44d26" mark="5" />
  if (ext === 'css') return <Shield color="#1f7ad8" mark="3" />
  if (ext === 'json') {
    return (
      <text x="8" y="12" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="ui-monospace, monospace" fill="#f5c542">{'{}'}</text>
    )
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return (
      <g>
        <rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="#26a69a" />
        <circle cx="5.3" cy="6" r="1.3" fill="#e0f2f1" />
        <path d="M2.5 12.5l3.8-4 2.4 2.4 2-2 2.8 3.6z" fill="#e0f2f1" />
      </g>
    )
  }
  const badge = BADGES[ext] ?? { text: ext ? ext.slice(0, 3).toUpperCase() : '?', bg: '#64748b', fg: '#ffffff' }
  const font = badge.text.length >= 3 ? 5.2 : badge.text.length === 2 ? 6.6 : 8.4
  return (
    <g>
      <rect x="1" y="1" width="14" height="14" rx="2.6" fill={badge.bg} />
      <text x={badge.text.length >= 2 ? 14.2 : 8} y="12.9" textAnchor={badge.text.length >= 2 ? 'end' : 'middle'} fontSize={font} fontWeight="800" fontFamily="system-ui, sans-serif" fill={badge.fg}>
        {badge.text}
      </text>
    </g>
  )
}

export function FileIcon({ path, size = 16, className = '' }: Props) {
  const ext = extensionOf(path)
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={`shrink-0 ${className}`} data-file-icon={ext || 'file'}>
      <Glyph ext={ext} />
    </svg>
  )
}
