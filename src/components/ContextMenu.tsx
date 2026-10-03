import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'

export type MenuItem =
  | { label: string; hint?: string; icon?: ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }
  | 'separator'

export type MenuState = { x: number; y: number; items: MenuItem[] }

export function menuEvent(event: ReactMouseEvent, items: MenuItem[]): MenuState {
  return { x: event.clientX, y: event.clientY, items }
}

export function ContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: menu.x, y: menu.y })
  const [index, setIndex] = useState(-1)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const x = Math.max(4, Math.min(menu.x, window.innerWidth - rect.width - 4))
    const y = Math.max(4, Math.min(menu.y, window.innerHeight - rect.height - 4))
    if (x !== pos.x || y !== pos.y) setPos({ x, y })
  }, [menu, pos.x, pos.y])

  useEffect(() => {
    const actionable = menu.items.map((item, at) => (item === 'separator' || item.disabled ? -1 : at)).filter((at) => at >= 0)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter') return
      event.preventDefault()
      if (event.key === 'Enter') {
        const item = menu.items[index]
        if (item && item !== 'separator' && !item.disabled) {
          onClose()
          item.onClick()
        }
        return
      }
      setIndex((current) => {
        const at = actionable.indexOf(current)
        const next = event.key === 'ArrowDown' ? (at < 0 ? 0 : (at + 1) % actionable.length) : at <= 0 ? actionable.length - 1 : at - 1
        return actionable[next] ?? -1
      })
    }
    const away = (event: Event) => {
      if (event.target instanceof Node && ref.current?.contains(event.target)) return
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousedown', away, true)
    window.addEventListener('contextmenu', away, true)
    window.addEventListener('blur', onClose)
    window.addEventListener('resize', onClose)
    document.addEventListener('scroll', onClose, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousedown', away, true)
      window.removeEventListener('contextmenu', away, true)
      window.removeEventListener('blur', onClose)
      window.removeEventListener('resize', onClose)
      document.removeEventListener('scroll', onClose, true)
    }
  }, [menu, index, onClose])

  return (
    <div
      ref={ref}
      role="menu"
      data-testid="context-menu"
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[80] min-w-44 max-w-72 rounded-lg border border-fg/10 bg-elevated py-1 shadow-2xl"
      onContextMenu={(event) => event.preventDefault()}
    >
      {menu.items.map((item, at) =>
        item === 'separator' ? (
          <div key={at} className="mx-2 my-1 border-t border-fg/10" />
        ) : (
          <button
            key={at}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onMouseEnter={() => setIndex(at)}
            onClick={() => {
              onClose()
              item.onClick()
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] ${
              item.disabled ? 'cursor-default text-muted/50' : item.danger ? 'text-rose-300 hover:bg-rose-500/15' : index === at ? 'bg-accent/15 text-fg' : 'text-fg/85 hover:bg-fg/5'
            }`}
          >
            {item.icon && <span className="w-4 shrink-0 text-muted/80">{item.icon}</span>}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.hint && <span className="ml-4 shrink-0 text-[10px] uppercase tracking-wide text-muted/60">{item.hint}</span>}
          </button>
        ),
      )}
    </div>
  )
}
