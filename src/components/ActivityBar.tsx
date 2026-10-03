import type { ReactNode } from 'react'
import { Files, ListTree, Palette, Search, Settings } from 'lucide-react'

export type SideView = 'explorer' | 'search' | 'outline'

type Props = {
  view: SideView
  open: boolean
  onView: (view: SideView) => void
  onThemes: () => void
  onSettings: () => void
}

export function ActivityBar({ view, open, onView, onThemes, onSettings }: Props) {
  return (
    <nav aria-label="Activity bar" className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-fg/10 bg-sidebar py-2">
      <Item label="Explorer (Ctrl+Shift+E)" active={open && view === 'explorer'} onClick={() => onView('explorer')} icon={<Files size={20} />} />
      <Item label="Search (Ctrl+Shift+F)" active={open && view === 'search'} onClick={() => onView('search')} icon={<Search size={20} />} />
      <Item label="Outline (Ctrl+Shift+U)" active={open && view === 'outline'} onClick={() => onView('outline')} icon={<ListTree size={20} />} />
      <span className="flex-1" />
      <Item label="Color Theme (Ctrl+K Ctrl+T)" active={false} onClick={onThemes} icon={<Palette size={19} />} />
      <Item label="Settings (Ctrl+,)" active={false} onClick={onSettings} icon={<Settings size={19} />} />
    </nav>
  )
}

function Item({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`relative grid h-11 w-12 place-items-center transition-colors ${active ? 'text-fg' : 'text-muted/70 hover:text-fg'}`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-accent" />}
      {icon}
    </button>
  )
}
