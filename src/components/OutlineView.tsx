import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { Box, Braces, Hash, SquareFunction, Type, Variable, Anchor } from 'lucide-react'
import { editEvents } from '../lib/editEvents'
import { statusStore } from '../lib/statusStore'
import { documentSymbols, symbolAt, type SymbolKind } from '../lib/symbols'

type Props = {
  active: string
  getFiles: () => Record<string, string>
  onReveal: (path: string, line: number, column: number) => void
}

const ICONS: Record<SymbolKind, { icon: ReactNode; color: string; label: string }> = {
  component: { icon: <Box size={13} />, color: 'var(--syn-component)', label: 'Component' },
  function: { icon: <SquareFunction size={13} />, color: 'var(--syn-fn)', label: 'Function' },
  hook: { icon: <Anchor size={13} />, color: 'var(--syn-control)', label: 'Hook' },
  variable: { icon: <Variable size={13} />, color: 'var(--syn-attr)', label: 'Variable' },
  type: { icon: <Type size={13} />, color: 'var(--syn-component)', label: 'Type' },
  class: { icon: <Braces size={13} />, color: 'var(--syn-component)', label: 'Class' },
  selector: { icon: <Hash size={13} />, color: 'var(--syn-tag)', label: 'Selector' },
  element: { icon: <Hash size={13} />, color: 'var(--syn-tag)', label: 'Element' },
}

export function symbolIcon(kind: SymbolKind) {
  return ICONS[kind]
}

export function OutlineView({ active, getFiles, onReveal }: Props) {
  const version = useSyncExternalStore(editEvents.subscribe, editEvents.version)
  const line = useSyncExternalStore(statusStore.subscribe, () => statusStore.get().line)
  const symbols = useMemo(
    () => documentSymbols(active, getFiles()[active] ?? ''),
    // version re-reads the file after edits.
    [active, getFiles, version],
  )
  const current = symbolAt(symbols, line)

  return (
    <div className="flex h-full w-full flex-col bg-sidebar" data-testid="outline-view">
      <div className="flex h-10 shrink-0 items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted/75">Outline</span>
        <span className="truncate pl-2 text-[11px] text-muted/70">{active.split('/').pop()}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto pb-4">
        {symbols.length === 0 && <p className="px-4 py-2 text-[12px] text-muted/75">No symbols found in this file.</p>}
        {symbols.map((symbol) => {
          const meta = ICONS[symbol.kind]
          const selected = current === symbol
          return (
            <button
              key={`${symbol.line}:${symbol.name}`}
              type="button"
              title={`${meta.label} · line ${symbol.line}`}
              onClick={() => onReveal(active, symbol.line, symbol.column)}
              style={{ paddingLeft: 12 + Math.min(symbol.depth, 6) * 12 }}
              className={`flex h-6 w-full items-center gap-2 pr-3 text-left text-[12.5px] ${selected ? 'bg-accent/20 text-fg' : 'text-fg/85 hover:bg-fg/5'}`}
            >
              <span style={{ color: meta.color }}>{meta.icon}</span>
              <span className="truncate">{symbol.name}</span>
              <span className="ml-auto text-[10px] text-muted/60">{symbol.line}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
