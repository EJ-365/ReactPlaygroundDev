import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { isDocFile } from '../lib/files'
import { FileIcon } from './FileIcon'

type Props = {
  tabs: string[]
  active: string
  problems: Set<string>
  unsaved: Set<string>
  extra?: ReactNode
  onSelect: (path: string) => void
  onClose: (path: string) => void
}

export function TabBar({ tabs, active, problems, unsaved, extra, onSelect, onClose }: Props) {
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active, tabs.length])

  return (
    <div className="flex h-9 shrink-0 items-stretch border-b border-fg/10 bg-tabs" data-tour="tabs">
      <div
        ref={list}
        role="tablist"
        aria-label="Open editors"
        className="flex min-w-0 flex-1 items-stretch overflow-x-auto"
        onWheel={(event) => {
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) event.currentTarget.scrollLeft += event.deltaY
        }}
      >
        {tabs.map((tab) => {
          const selected = tab === active
          const dirty = unsaved.has(tab)
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`tab-${tab}`}
              data-active={selected}
              title={tab}
              onClick={() => onSelect(tab)}
              onAuxClick={(event) => {
                if (event.button === 1 && !isDocFile(tab)) onClose(tab)
              }}
              className={`group relative -mb-px flex shrink-0 items-center gap-2 border-r border-fg/10 px-3 text-[12.5px] transition-colors ${
                selected ? 'bg-editor font-medium text-fg' : 'text-muted/80 hover:bg-fg/[0.04] hover:text-fg'
              }`}
            >
              {selected && <span className="absolute inset-x-0 top-0 h-[2px] bg-accent shadow-[0_0_12px_rgb(var(--c-accent)/0.7)]" />}
              <FileIcon path={tab} size={15} className={selected ? '' : 'opacity-75 group-hover:opacity-100'} />
              <span className={`max-w-40 truncate ${problems.has(tab) ? 'text-rose-300' : ''}`}>{tab.split('/').pop()}</span>
              {isDocFile(tab) ? (
                dirty && <span className="h-2 w-2 rounded-full bg-fg/70" aria-label="Unsaved changes" />
              ) : (
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Close ${tab}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose(tab)
                  }}
                  className={`relative grid h-4 w-4 place-items-center rounded hover:bg-fg/10 ${selected || dirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  {dirty ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-fg/70 group-hover:hidden" aria-label="Unsaved changes" />
                      <X size={12} className="hidden group-hover:block" />
                    </>
                  ) : (
                    <X size={12} />
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {extra && <div className="flex shrink-0 items-center gap-1 border-l border-fg/10 px-2">{extra}</div>}
    </div>
  )
}
