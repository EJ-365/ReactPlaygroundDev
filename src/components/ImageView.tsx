import { useEffect, useRef, useState } from 'react'
import { ImageOff, Maximize, Minus, Plus } from 'lucide-react'
import { isDataUrl } from '../lib/media'

const CHECKER = {
  backgroundColor: '#202329',
  backgroundImage:
    'repeating-conic-gradient(rgba(255,255,255,0.07) 0% 25%, transparent 0% 50%)',
  backgroundSize: '16px 16px',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function ImageView({ path, content }: { path: string; content: string }) {
  const ok = isDataUrl(content)
  const [zoom, setZoom] = useState<'fit' | number>('fit')
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setZoom('fit')
    setNatural(null)
  }, [path])

  const step = (dir: 1 | -1) => {
    setZoom((current) => {
      const base = current === 'fit' ? 1 : current
      const next = Math.min(8, Math.max(0.05, base + (dir > 0 ? 0.25 : -0.25)))
      return Number(next.toFixed(2))
    })
  }

  const bytes = ok ? Math.round((content.length - content.indexOf(',') - 1) * 0.75) : 0
  const width = zoom === 'fit' ? undefined : natural ? natural.w * zoom : undefined

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-editor" data-testid="image-view">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-fg/10 px-3 text-[11px] text-muted">
        <span className="min-w-0 flex-1 truncate font-mono">{path}</span>
        {natural && <span>{natural.w}×{natural.h}</span>}
        {bytes > 0 && <span className="shrink-0">{formatBytes(bytes)}</span>}
        <span className="ml-1 flex items-center">
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => step(-1)} className="rounded-md p-1.5 hover:bg-fg/5 hover:text-fg">
            <Minus size={13} />
          </button>
          <button
            type="button"
            title="Reset zoom to fit"
            onClick={() => setZoom('fit')}
            className="min-w-12 rounded px-1 font-mono text-center hover:bg-fg/5 hover:text-fg"
          >
            {zoom === 'fit' ? 'Fit' : `${Math.round(zoom * 100)}%`}
          </button>
          <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => step(1)} className="rounded-md p-1.5 hover:bg-fg/5 hover:text-fg">
            <Plus size={13} />
          </button>
          <button type="button" title="Actual size (100%)" onClick={() => setZoom(1)} className="rounded-md p-1.5 hover:bg-fg/5 hover:text-fg">
            <Maximize size={12} />
          </button>
        </span>
      </div>
      <div
        ref={scroller}
        className="min-h-0 flex-1 overflow-auto"
        onWheel={(event) => {
          if (!(event.ctrlKey || event.metaKey)) return
          event.preventDefault()
          step(event.deltaY < 0 ? 1 : -1)
        }}
      >
        <div className="grid min-h-full place-items-center p-6" style={CHECKER}>
          {ok ? (
            <img
              src={content}
              alt={path}
              draggable={false}
              onLoad={(event) => setNatural({ w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight })}
              className="select-none rounded-sm shadow-2xl"
              style={width ? { width, maxWidth: 'none' } : { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center text-muted">
              <ImageOff size={28} />
              <p className="text-sm">No image data in this file.</p>
              <p className="text-xs text-muted/70">Upload an image to replace it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
