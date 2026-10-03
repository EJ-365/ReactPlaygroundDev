import { Fragment, useMemo, useSyncExternalStore } from 'react'
import { ChevronRight } from 'lucide-react'
import { editEvents } from '../lib/editEvents'
import { statusStore } from '../lib/statusStore'
import { documentSymbols, symbolAt } from '../lib/symbols'
import { FileIcon } from './FileIcon'
import { symbolIcon } from './OutlineView'

type Props = {
  active: string
  getFiles: () => Record<string, string>
  onReveal: (path: string, line: number, column: number) => void
  onFolder: () => void
}

export function Breadcrumbs({ active, getFiles, onReveal, onFolder }: Props) {
  const version = useSyncExternalStore(editEvents.subscribe, editEvents.version)
  const line = useSyncExternalStore(statusStore.subscribe, () => statusStore.get().line)
  const symbols = useMemo(
    () => documentSymbols(active, getFiles()[active] ?? ''),
    // version re-reads the file after edits.
    [active, getFiles, version],
  )
  const symbol = symbolAt(symbols, line)
  const parts = active.split('/')

  return (
    <div className="flex h-6 shrink-0 items-center gap-0.5 overflow-hidden whitespace-nowrap bg-editor px-3 text-[12px] text-muted" data-testid="breadcrumbs">
      {parts.slice(0, -1).map((part) => (
        <Fragment key={part}>
          <button type="button" onClick={onFolder} className="rounded px-0.5 hover:text-fg">{part}</button>
          <ChevronRight size={12} className="shrink-0 opacity-60" />
        </Fragment>
      ))}
      <span className="flex items-center gap-1 text-fg/85">
        <FileIcon path={active} size={14} />
        {parts[parts.length - 1]}
      </span>
      {symbol && (
        <>
          <ChevronRight size={12} className="shrink-0 opacity-60" />
          <button type="button" onClick={() => onReveal(active, symbol.line, symbol.column)} className="flex items-center gap-1 rounded px-0.5 hover:text-fg">
            <span style={{ color: symbolIcon(symbol.kind).color }}>{symbolIcon(symbol.kind).icon}</span>
            {symbol.name}
          </button>
        </>
      )}
    </div>
  )
}
