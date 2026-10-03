import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { CaseSensitive, ChevronRight, Regex, Replace, ReplaceAll, WholeWord } from 'lucide-react'
import { editEvents } from '../lib/editEvents'
import { FileIcon } from './FileIcon'

type Props = {
  getFiles: () => Record<string, string>
  onReveal: (path: string, line: number, column: number) => void
  onReplace: (path: string, value: string) => void
  focusKey: number
}

type Match = { line: number; column: number; length: number; text: string }

const MAX_RESULTS = 2000

function buildPattern(query: string, matchCase: boolean, wholeWord: boolean, regex: boolean) {
  if (!query) return null
  try {
    let source = regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (wholeWord) source = `\\b${source}\\b`
    return { pattern: new RegExp(source, matchCase ? 'g' : 'gi'), error: '' }
  } catch (error) {
    return { pattern: null, error: error instanceof Error ? error.message : 'Invalid pattern' }
  }
}

export function SearchView({ getFiles, onReveal, onReplace, focusKey }: Props) {
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [regex, setRegex] = useState(false)
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const input = useRef<HTMLInputElement>(null)
  const version = useSyncExternalStore(editEvents.subscribe, editEvents.version)

  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [focusKey])

  const built = useMemo(() => buildPattern(query, matchCase, wholeWord, regex), [query, matchCase, wholeWord, regex])

  const results = useMemo(() => {
    const groups: Array<{ path: string; matches: Match[] }> = []
    const pattern = built?.pattern
    if (!pattern) return { groups, total: 0 }
    let total = 0
    for (const [path, content] of Object.entries(getFiles()).sort(([a], [b]) => a.localeCompare(b))) {
      const matches: Match[] = []
      content.split(/\r?\n/).forEach((text, index) => {
        if (total >= MAX_RESULTS) return
        pattern.lastIndex = 0
        for (const match of text.matchAll(pattern)) {
          if (!match[0]) continue
          matches.push({ line: index + 1, column: (match.index ?? 0) + 1, length: match[0].length, text })
          total += 1
        }
      })
      if (matches.length) groups.push({ path, matches })
    }
    return { groups, total }
    // version re-runs the search after edits.
  }, [built, getFiles, version])

  const replaceIn = (path: string) => {
    const pattern = built?.pattern
    if (!pattern) return
    const content = getFiles()[path]
    if (content == null) return
    onReplace(path, content.replace(new RegExp(pattern.source, pattern.flags), replacement))
  }

  const toggle = (path: string) => {
    setClosed((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div className="flex h-full w-full flex-col bg-sidebar" data-testid="search-view">
      <div className="flex h-10 shrink-0 items-center px-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted/75">Search</span>
      </div>
      <div className="flex gap-1 px-2">
        <button
          type="button"
          title={showReplace ? 'Hide replace' : 'Show replace'}
          aria-label="Toggle replace"
          onClick={() => setShowReplace((open) => !open)}
          className="mt-1 h-6 rounded text-muted hover:bg-fg/5 hover:text-fg"
        >
          <ChevronRight size={14} className={`transition-transform ${showReplace ? 'rotate-90' : ''}`} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center rounded-md border border-fg/10 bg-fg/5 pr-1 ring-accent/40 focus-within:ring-2">
            <input
              ref={input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search across files"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent px-2 py-1 text-[13px] outline-none"
            />
            <Toggle label="Match Case" on={matchCase} onClick={() => setMatchCase((v) => !v)} icon={<CaseSensitive size={15} />} />
            <Toggle label="Match Whole Word" on={wholeWord} onClick={() => setWholeWord((v) => !v)} icon={<WholeWord size={15} />} />
            <Toggle label="Use Regular Expression" on={regex} onClick={() => setRegex((v) => !v)} icon={<Regex size={15} />} />
          </div>
          {showReplace && (
            <div className="flex items-center rounded-md border border-fg/10 bg-fg/5 pr-1 ring-accent/40 focus-within:ring-2">
              <input
                value={replacement}
                onChange={(event) => setReplacement(event.target.value)}
                placeholder="Replace"
                aria-label="Replace with"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent px-2 py-1 text-[13px] outline-none"
              />
              <Toggle
                label="Replace All"
                on={false}
                disabled={!results.total}
                onClick={() => results.groups.forEach((group) => replaceIn(group.path))}
                icon={<ReplaceAll size={15} />}
              />
            </div>
          )}
        </div>
      </div>
      <p className="px-4 pb-1 pt-2 text-[11px] text-muted/80">
        {built?.error
          ? <span className="text-rose-300">{built.error}</span>
          : query
            ? `${results.total}${results.total >= MAX_RESULTS ? '+' : ''} ${results.total === 1 ? 'result' : 'results'} in ${results.groups.length} ${results.groups.length === 1 ? 'file' : 'files'}`
            : 'Search every file in the project.'}
      </p>
      <div className="min-h-0 flex-1 overflow-auto pb-4">
        {results.groups.map((group) => {
          const open = !closed.has(group.path)
          return (
            <div key={group.path}>
              <div className="group flex h-6 items-center gap-1 pl-2 pr-2 text-[12.5px] hover:bg-fg/5">
                <button type="button" onClick={() => toggle(group.path)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
                  <ChevronRight size={13} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
                  <FileIcon path={group.path} size={14} />
                  <span className="truncate text-fg">{group.path.split('/').pop()}</span>
                  <span className="truncate text-[11px] text-muted/70">{group.path.includes('/') ? group.path.slice(0, group.path.lastIndexOf('/')) : ''}</span>
                </button>
                {showReplace && (
                  <button type="button" title="Replace in file" aria-label={`Replace in ${group.path}`} onClick={() => replaceIn(group.path)} className="rounded p-0.5 text-muted opacity-0 hover:bg-fg/10 hover:text-fg group-hover:opacity-100">
                    <Replace size={13} />
                  </button>
                )}
                <span className="rounded-full bg-fg/10 px-1.5 text-[10px] text-fg/80">{group.matches.length}</span>
              </div>
              {open &&
                group.matches.map((match) => {
                  const start = Math.max(0, match.column - 1 - 24)
                  const before = match.text.slice(start, match.column - 1).trimStart()
                  const hit = match.text.slice(match.column - 1, match.column - 1 + match.length)
                  const after = match.text.slice(match.column - 1 + match.length, match.column - 1 + match.length + 80)
                  return (
                    <button
                      key={`${match.line}:${match.column}`}
                      type="button"
                      onClick={() => onReveal(group.path, match.line, match.column)}
                      className="flex h-6 w-full items-center gap-2 pl-8 pr-2 text-left font-mono text-[12px] text-fg/80 hover:bg-fg/5"
                    >
                      <span className="truncate">
                        {start > 0 && '…'}
                        {before}
                        <mark className={`rounded-sm px-px text-fg ${showReplace && replacement !== '' ? 'bg-rose-400/30 line-through' : 'bg-accent/35'}`}>{hit}</mark>
                        {showReplace && replacement !== '' && <mark className="rounded-sm bg-emerald-400/30 px-px text-fg">{replacement}</mark>}
                        {after}
                      </span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted/60">{match.line}</span>
                    </button>
                  )
                })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Toggle({ label, on, onClick, icon, disabled }: { label: string; on: boolean; onClick: () => void; icon: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`rounded p-0.5 disabled:opacity-30 ${on ? 'bg-accent/30 text-fg ring-1 ring-accent/60' : 'text-muted hover:bg-fg/10 hover:text-fg'}`}
    >
      {icon}
    </button>
  )
}
