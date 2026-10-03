import { useEffect, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { APP_VERSION, CHANGELOG } from '../lib/changelog'

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function WhatsNew() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const away = (event: Event) => {
      if (event.target instanceof Node && button.current?.parentElement?.contains(event.target)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousedown', away, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousedown', away, true)
    }
  }, [open])

  const toggle = () => {
    if (!open && button.current) {
      const rect = button.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) })
    }
    setOpen((value) => !value)
  }

  return (
    <span className="relative">
      <button
        ref={button}
        type="button"
        title="What's new"
        aria-label="What's new"
        aria-expanded={open}
        onClick={toggle}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition ${
          open ? 'bg-accent/15 text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg'
        }`}
      >
        <Sparkles size={14} className="text-accent" />
        <span className="hidden lg:inline">What&apos;s New</span>
      </button>
      {open && (
        <div
          data-testid="whats-new"
          className="fixed z-[70] w-[22rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-fg/10 bg-elevated shadow-2xl"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="flex items-center justify-between border-b border-fg/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-accent" />
              <h2 className="text-sm font-semibold text-fg">What&apos;s New</h2>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-fg">v{APP_VERSION}</span>
            </div>
            <button type="button" title="Close" onClick={() => setOpen(false)} className="rounded-md p-1 text-muted hover:bg-fg/5 hover:text-fg">
              <X size={14} />
            </button>
          </div>
          <div className="max-h-[26rem] overflow-y-auto px-4 py-4">
            <ol className="relative border-l border-accent/25 pl-5">
              {CHANGELOG.map((entry, index) => (
                <li key={entry.version} className="relative pb-6 last:pb-1">
                  <span
                    className={`absolute -left-[1.65rem] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-elevated ${
                      index === 0 ? 'bg-accent shadow-[0_0_10px_2px_rgba(139,124,255,0.45)]' : 'bg-fg/25'
                    }`}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold text-fg">{entry.title}</span>
                    <span className="font-mono text-[11px] text-accent">v{entry.version}</span>
                    <span className="text-[11px] text-muted/75">{formatDate(entry.date)}</span>
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {entry.items.map((item) => (
                      <li key={item} className="text-[13px] leading-5 text-fg/75">
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </span>
  )
}
