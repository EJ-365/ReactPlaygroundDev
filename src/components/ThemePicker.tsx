import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { settingsStore } from '../lib/settings'
import { THEMES } from '../lib/themes'

export function ThemePicker({ onClose }: { onClose: () => void }) {
  const original = useRef(settingsStore.get().theme)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(() => Math.max(0, THEMES.findIndex((theme) => theme.id === original.current)))
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? THEMES.filter((theme) => `${theme.label} ${theme.kind} ${theme.colorful ? 'colorful' : ''}`.toLowerCase().includes(q)) : THEMES
  }, [query])

  useEffect(() => input.current?.focus(), [])

  useEffect(() => {
    const theme = items[index]
    if (theme) settingsStore.update({ theme: theme.id })
    list.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [index, items])

  const cancel = () => {
    settingsStore.update({ theme: original.current })
    onClose()
  }

  const choose = (id: string) => {
    settingsStore.update({ theme: id })
    original.current = id
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 px-4 pt-16" onMouseDown={cancel}>
      <div className="h-fit w-full max-w-lg overflow-hidden rounded-xl border border-fg/10 bg-elevated shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-fg/10 px-3">
          <Palette size={15} className="text-accent" />
          <input
            ref={input}
            value={query}
            placeholder="Select color theme (Up/Down to preview)"
            aria-label="Search color themes"
            onChange={(event) => {
              setQuery(event.target.value)
              setIndex(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setIndex((current) => Math.min(items.length - 1, current + 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setIndex((current) => Math.max(0, current - 1))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                const theme = items[index]
                if (theme) choose(theme.id)
              } else if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                cancel()
              }
            }}
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted/70"
          />
        </div>
        <div ref={list} className="max-h-[60vh] overflow-auto py-1" role="listbox">
          {items.map((theme, i) => (
            <button
              key={theme.id}
              type="button"
              role="option"
              data-index={i}
              aria-selected={i === index}
              onMouseEnter={() => setIndex(i)}
              onClick={() => choose(theme.id)}
              className={`flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm ${i === index ? 'bg-accent/20 text-fg' : 'text-fg/85'}`}
            >
              <span className="flex h-4 w-10 shrink-0 overflow-hidden rounded-sm ring-1 ring-fg/10">
                {[theme.ui.editor, theme.syntax.tag, theme.syntax.keyword, theme.syntax.string, theme.syntax.fn].map((color, c) => (
                  <span key={c} className="flex-1" style={{ background: color }} />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate">{theme.label}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted">{theme.colorful ? 'colorful' : theme.kind}</span>
              {theme.id === original.current && <Check size={13} className="text-accent" />}
            </button>
          ))}
          {items.length === 0 && <p className="px-3 py-4 text-sm text-muted">No matching themes</p>}
        </div>
      </div>
    </div>
  )
}
