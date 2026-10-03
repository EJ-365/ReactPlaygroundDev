import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AlertTriangle, Bug, Maximize2, Minimize2, Minus, PanelBottom, PanelRight, Plus, Square, Trash2, X } from 'lucide-react'
import { DEFAULT_SETTINGS, settingsStore } from '../lib/settings'
import type { ConsoleEntry, ConsoleTab, PanelLayout, Problem, Ser } from '../types'
import type { RunHandle } from '../lib/nodeRunner'
import { complete, execute, prompt, type Part, type ShellContext, type ShellIO, type Tone } from '../lib/terminal'

type Props = {
  entries: ConsoleEntry[]
  problems: Problem[]
  tab: ConsoleTab
  preserve: boolean
  layout: PanelLayout
  onLayout: (layout: PanelLayout) => void
  shell: ShellContext
  onTab: (tab: ConsoleTab) => void
  onPreserve: (value: boolean) => void
  onClear: (source?: ConsoleEntry['source']) => void
  onEval: (code: string) => void
  onReveal: (problem: Problem) => void
  onClose?: () => void
}

const TABS: { id: ConsoleTab; label: string }[] = [
  { id: 'problems', label: 'Problems' },
  { id: 'output', label: 'Output' },
  { id: 'debug', label: 'Debug Console' },
  { id: 'terminal', label: 'Terminal' },
]

export function ConsolePanel(props: Props) {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const terminal = useRef({ stop: () => {}, clear: () => {} })
  const output = useMemo(() => props.entries.filter((entry) => entry.source === 'page'), [props.entries])
  const debug = useMemo(() => props.entries.filter((entry) => entry.source === 'repl'), [props.entries])
  const outputErrors = output.filter((entry) => entry.level === 'error').length
  const filter = filters[props.tab] ?? ''
  const counts: Partial<Record<ConsoleTab, number>> = { problems: props.problems.length, output: outputErrors }
  const fontSize = useSyncExternalStore(settingsStore.subscribe, () => settingsStore.get().panelFontSize)
  return (
    <section className="flex h-full min-h-0 flex-col bg-sidebar" data-testid="console-panel" style={{ fontSize }}>
      <header className="flex h-9 shrink-0 items-stretch gap-1 border-b border-fg/10 pl-2 pr-1" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={props.tab === item.id}
            data-testid={`panel-tab-${item.id}`}
            onClick={() => props.onTab(item.id)}
            className={`flex items-center gap-1.5 border-b-2 px-2 text-[11px] font-medium uppercase tracking-wide ${
              props.tab === item.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            {item.label}
            {(counts[item.id] ?? 0) > 0 && (
              <span className={`rounded-full px-1.5 text-[10px] ${item.id === 'output' || props.problems.some((problem) => problem.severity === 'error') ? 'bg-rose-500/20 text-rose-200' : 'bg-fg/10 text-fg/80'}`}>{counts[item.id]}</span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          {(props.tab === 'output' || props.tab === 'debug') && (
            <input
              value={filter}
              onChange={(event) => setFilters((current) => ({ ...current, [props.tab]: event.target.value }))}
              placeholder="Filter"
              aria-label="Filter"
              className="hidden h-6 w-40 rounded border border-fg/10 bg-editor px-2 text-xs text-fg outline-none placeholder:text-muted/55 focus:border-accent sm:block"
            />
          )}
          {props.tab === 'output' && (
            <label className="hidden items-center gap-1.5 whitespace-nowrap text-[11px] text-muted md:flex" title="Keep output when the page reloads">
              <input type="checkbox" checked={props.preserve} onChange={(event) => props.onPreserve(event.target.checked)} className="accent-accent" />
              Preserve log
            </label>
          )}
          {props.tab === 'terminal' && (
            <span className="hidden font-mono text-[11px] text-muted sm:inline">{running ? 'node' : 'sh'}</span>
          )}
          {props.tab === 'terminal' && running && (
            <IconButton title="Stop (Ctrl+C)" onClick={() => terminal.current.stop()}>
              <Square size={13} />
            </IconButton>
          )}
          {props.tab !== 'problems' && (
            <span className="hidden items-center text-[11px] text-muted sm:flex" data-testid="panel-font-size">
              <IconButton title="Decrease panel font size (Ctrl+-)" onClick={() => settingsStore.update({ panelFontSize: fontSize - 1 })}>
                <Minus size={12} />
              </IconButton>
              <button type="button" title="Reset panel font size (Ctrl+0)" onClick={() => settingsStore.update({ panelFontSize: DEFAULT_SETTINGS.panelFontSize })} className="rounded px-1 font-mono hover:bg-fg/5 hover:text-fg">
                {fontSize}px
              </button>
              <IconButton title="Increase panel font size (Ctrl+=)" onClick={() => settingsStore.update({ panelFontSize: fontSize + 1 })}>
                <Plus size={12} />
              </IconButton>
            </span>
          )}
          {props.tab !== 'problems' && (
            <IconButton
              title={props.tab === 'terminal' ? 'Clear terminal (Ctrl+L)' : props.tab === 'debug' ? 'Clear debug console' : 'Clear output'}
              onClick={() => (props.tab === 'terminal' ? terminal.current.clear() : props.onClear(props.tab === 'debug' ? 'repl' : 'page'))}
            >
              <Trash2 size={14} />
            </IconButton>
          )}
          <span className="hidden items-center sm:flex" role="group" aria-label="Panel layout">
            <IconButton title="Move panel to bottom" onClick={() => props.onLayout('bottom')} active={props.layout === 'bottom'}>
              <PanelBottom size={13} />
            </IconButton>
            <IconButton title="Move panel right" onClick={() => props.onLayout('right')} active={props.layout === 'right'}>
              <PanelRight size={13} />
            </IconButton>
            <IconButton title={props.layout === 'full' ? 'Restore panel size' : 'Maximize panel'} onClick={() => props.onLayout(props.layout === 'full' ? 'bottom' : 'full')} active={props.layout === 'full'}>
              {props.layout === 'full' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </IconButton>
          </span>
          {props.onClose && (
            <IconButton title="Close panel (Ctrl+J)" onClick={props.onClose}>
              <X size={14} />
            </IconButton>
          )}
        </div>
      </header>
      {props.tab === 'problems' && <ProblemsView problems={props.problems} onReveal={props.onReveal} />}
      {props.tab === 'output' && <OutputView entries={output} filter={filter} />}
      {props.tab === 'debug' && <DebugView entries={debug} filter={filter} onEval={props.onEval} />}
      <TerminalView shell={props.shell} active={props.tab === 'terminal'} onRunning={setRunning} controls={terminal} />
    </section>
  )
}

function IconButton({ title, onClick, active, children }: { title: string; onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} aria-pressed={active} onClick={onClick} className={`rounded-md p-1.5 ${active ? 'bg-fg/10 text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg'}`}>
      {children}
    </button>
  )
}

function useStickyScroll(deps: unknown) {
  const scroller = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  useEffect(() => {
    const node = scroller.current
    if (stick.current && node) node.scrollTop = node.scrollHeight
  }, [deps])
  const onScroll = () => {
    const node = scroller.current
    if (node) stick.current = node.scrollHeight - node.scrollTop - node.clientHeight < 28
  }
  return { scroller, onScroll }
}

function matches(entry: ConsoleEntry, filter: string) {
  const query = filter.trim().toLowerCase()
  return !query || entry.level.includes(query) || entry.args.map((arg) => formatSer(arg, true)).join(' ').toLowerCase().includes(query)
}

export function formatSer(value: Ser, top = false, depth = 0): string {
  switch (value.t) {
    case 'string':
      return top ? value.v : `'${value.v}'`
    case 'number':
    case 'bigint':
    case 'symbol':
    case 'element':
      return String(value.v)
    case 'boolean':
      return String(value.v)
    case 'null':
      return 'null'
    case 'undefined':
      return 'undefined'
    case 'function':
      return `[Function${value.v.length > 2 ? `: ${value.v.slice(2)}` : ' (anonymous)'}]`
    case 'circular':
      return '[Circular]'
    case 'max':
      return '…'
    case 'error':
      return `${value.name}: ${value.message}`
    case 'array': {
      if (!value.v.length) return '[]'
      const items = value.v.map((item) => formatSer(item, false, depth + 1))
      if (value.length > value.v.length) items.push(`... ${value.length - value.v.length} more items`)
      return wrapItems('[', items, ']', depth)
    }
    default: {
      const items = value.v.map((entry) => `${/^[A-Za-z_$][\w$]*$/.test(entry.k) ? entry.k : `'${entry.k}'`}: ${formatSer(entry.v, false, depth + 1)}`)
      const prefix = value.name && value.name !== 'Object' ? `${value.name} ` : ''
      return items.length ? `${prefix}${wrapItems('{', items, '}', depth)}` : `${prefix}{}`
    }
  }
}

function wrapItems(open: string, items: string[], close: string, depth: number) {
  const flat = `${open} ${items.join(', ')} ${close}`
  if (flat.length <= 72 && !flat.includes('\n')) return flat
  const pad = '  '.repeat(depth + 1)
  return `${open}\n${items.map((item) => pad + item).join(',\n')}\n${'  '.repeat(depth)}${close}`
}

const LEVEL_TONE: Partial<Record<ConsoleEntry['level'], string>> = {
  error: 'text-rose-300',
  warn: 'text-amber-300',
  info: 'text-sky-300',
  debug: 'text-muted',
}

function OutputView({ entries, filter }: { entries: ConsoleEntry[]; filter: string }) {
  const visible = useMemo(() => entries.filter((entry) => matches(entry, filter)), [entries, filter])
  const { scroller, onScroll } = useStickyScroll(visible)
  return (
    <div ref={scroller} onScroll={onScroll} data-testid="output-view" className="min-h-0 flex-1 overflow-auto bg-editor px-3 py-1.5 font-mono leading-[1.6]">
      {visible.length === 0 && <p className="py-6 text-center font-sans text-xs text-muted/75">Nothing printed yet. <code>console.log</code> output from your page shows up here.</p>}
      {visible.map((entry) =>
        entry.level === 'system' ? (
          <div key={entry.id} className="mt-1 text-muted/70 first:mt-0">
            [{new Date(entry.time).toLocaleTimeString()}] {entry.args.map((arg) => formatSer(arg, true)).join(' ')}
          </div>
        ) : (
          <div key={entry.id} className={`whitespace-pre-wrap break-words ${LEVEL_TONE[entry.level] ?? 'text-fg'}`} title={new Date(entry.time).toLocaleTimeString()}>
            {entry.level === 'error' && entry.args[0]?.t === 'error' ? 'Uncaught ' : ''}
            {entry.args.map((arg) => formatSer(arg, true)).join(' ')}
            {entry.count > 1 && <span className="ml-2 rounded bg-fg/10 px-1.5 text-[10px] text-fg/80">×{entry.count}</span>}
          </div>
        ),
      )}
    </div>
  )
}

function DebugView({ entries, filter, onEval }: { entries: ConsoleEntry[]; filter: string; onEval: (code: string) => void }) {
  const visible = useMemo(() => entries.filter((entry) => matches(entry, filter)), [entries, filter])
  const { scroller, onScroll } = useStickyScroll(visible)
  const [draft, setDraft] = useState('')
  const history = useRef<string[]>([])
  const historyAt = useRef(-1)

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="debug-view">
      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-auto px-2 py-1 font-mono leading-[1.85]">
        {visible.length === 0 && (
          <p className="px-2 py-6 text-center font-sans text-xs text-muted/75">
            Evaluate JavaScript in the running page, for example <code>document.title</code> or <code>[...document.querySelectorAll('a')]</code>.
          </p>
        )}
        {visible.map((entry) => (
          <div key={entry.id} className="group flex gap-2 rounded px-1.5 hover:bg-fg/[0.03]" title={new Date(entry.time).toLocaleTimeString()}>
            {entry.level === 'input' ? <span className="w-3 shrink-0 text-accent">›</span> : entry.level === 'error' ? <Bug size={13} className="mt-1.5 shrink-0 text-rose-300" /> : <span className="w-3 shrink-0 text-muted/70">‹</span>}
            <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">
              <span className="inline-flex flex-wrap gap-x-2">
                {entry.args.map((arg, index) => (entry.level === 'input' && arg.t === 'string' ? <span key={index} className="text-fg">{arg.v}</span> : <ValueView key={index} value={arg} />))}
              </span>
            </div>
          </div>
        ))}
      </div>
      <form
        className="flex items-start gap-2 border-t border-fg/10 px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault()
          const code = draft.trim()
          if (!code) return
          history.current = [code, ...history.current.filter((item) => item !== code)].slice(0, 50)
          historyAt.current = -1
          onEval(code)
          setDraft('')
        }}
      >
        <span className="pt-1 text-accent">›</span>
        <textarea
          data-testid="console-input"
          value={draft}
          rows={1}
          placeholder="Evaluate an expression in the page (Shift+Enter for a new line)"
          className="max-h-32 min-h-7 flex-1 resize-none bg-transparent font-mono leading-[1.85] text-fg outline-none placeholder:text-muted/55"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
            if (event.key === 'ArrowUp' && draft === '') {
              event.preventDefault()
              const next = Math.min(history.current.length - 1, historyAt.current + 1)
              historyAt.current = next
              setDraft(history.current[next] ?? '')
            }
            if (event.key === 'ArrowDown' && historyAt.current >= 0) {
              event.preventDefault()
              const next = historyAt.current - 1
              historyAt.current = next
              setDraft(next < 0 ? '' : history.current[next] ?? '')
            }
          }}
        />
      </form>
    </div>
  )
}

type TermLine = { id: number; parts: Part[]; cwd?: string }

const TONE_CLASS: Record<Tone, string> = {
  out: 'text-fg',
  err: 'text-rose-300',
  muted: 'text-muted',
  dir: 'text-sky-300 font-semibold',
  ok: 'text-emerald-300',
  accent: 'text-accent',
}

function TerminalView({ shell, active, onRunning, controls }: { shell: ShellContext; active: boolean; onRunning: (running: boolean) => void; controls: { current: { stop: () => void; clear: () => void } } }) {
  const nextId = useRef(1)
  const [lines, setLines] = useState<TermLine[]>(() => [
    { id: 0, parts: [{ text: 'Type help to see commands. Try ls, cat index.html, touch app.js, or node script.js.', tone: 'muted' }] },
  ])
  const [cwd, setCwdState] = useState('')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const shellRef = useRef(shell)
  shellRef.current = shell
  const history = useRef<string[]>([])
  const historyAt = useRef(-1)
  const proc = useRef<RunHandle | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const { scroller, onScroll } = useStickyScroll(lines)

  const io = useRef<ShellIO | null>(null)
  if (!io.current) {
    const append = (parts: Part[]) => setLines((prev) => {
      const next = [...prev, { id: nextId.current++, parts }]
      return next.length > 2000 ? next.slice(-2000) : next
    })
    const self: ShellIO = {
      cwd: '',
      setCwd: (value) => {
        self.cwd = value
        setCwdState(value)
      },
      print: (text, tone = 'out') => {
        for (const line of text.split('\n')) append([{ text: line, tone }])
      },
      printParts: append,
      clear: () => setLines([]),
      history: history.current,
      spawn: async (start) => {
        const handle = await start()
        if (!handle) return 1
        proc.current = handle
        const code = await handle.done
        proc.current = null
        return code
      },
    }
    io.current = self
  }

  useEffect(() => {
    if (active) input.current?.focus({ preventScroll: true })
  }, [active, busy])

  useEffect(() => {
    onRunning(busy)
  }, [busy, onRunning])

  const stop = () => {
    if (!proc.current) return
    proc.current.stop()
    io.current?.print('^C', 'muted')
  }
  controls.current = { stop, clear: () => setLines([]) }

  const submit = async (text: string) => {
    const shellIO = io.current
    if (!shellIO) return
    setLines((prev) => [...prev, { id: nextId.current++, cwd: shellIO.cwd, parts: [{ text, tone: 'out' }] }])
    setDraft('')
    historyAt.current = -1
    if (!text.trim()) return
    if (history.current[history.current.length - 1] !== text) history.current.push(text)
    setBusy(true)
    try {
      await execute(shellRef.current, shellIO, text)
    } catch (error) {
      shellIO.print(error instanceof Error ? error.message : String(error), 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      data-testid="terminal-view"
      onMouseUp={() => {
        if (!window.getSelection()?.toString()) input.current?.focus({ preventScroll: true })
      }}
      className={`${active ? 'block' : 'hidden'} min-h-0 flex-1 cursor-text overflow-auto bg-editor px-3 py-1.5 font-mono leading-[1.6]`}
    >
      {lines.map((line) => (
        <div key={line.id} className="whitespace-pre-wrap break-words">
          {line.cwd != null && <Prompt root={shell.root} cwd={line.cwd} />}
          {line.parts.map((part, index) => (
            <span key={index} className={TONE_CLASS[part.tone]}>{part.text}</span>
          ))}
        </div>
      ))}
      <div className={`flex items-center ${busy ? 'h-0 overflow-hidden' : ''}`}>
        {!busy && <Prompt root={shell.root} cwd={cwd} />}
        <input
          ref={input}
          value={draft}
          data-testid="terminal-input"
          aria-label="Terminal input"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          className="min-w-0 flex-1 bg-transparent font-mono text-fg caret-accent outline-none"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            const ctrl = event.ctrlKey || event.metaKey
            if (ctrl && event.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
              event.preventDefault()
              if (busy) stop()
              else {
                setLines((prev) => [...prev, { id: nextId.current++, cwd, parts: [{ text: `${draft}^C`, tone: 'out' }] }])
                setDraft('')
              }
              return
            }
            if (ctrl && event.key.toLowerCase() === 'l') {
              event.preventDefault()
              setLines([])
              return
            }
            if (busy) {
              event.preventDefault()
              return
            }
            if (event.key === 'Enter') {
              event.preventDefault()
              void submit(draft)
            } else if (event.key === 'Tab') {
              event.preventDefault()
              const result = complete(shellRef.current, cwd, draft)
              if (result.options.length > 1) {
                setLines((prev) => [
                  ...prev,
                  { id: nextId.current++, cwd, parts: [{ text: draft, tone: 'out' }] },
                  { id: nextId.current++, parts: [{ text: result.options.join('  '), tone: 'muted' }] },
                ])
              }
              setDraft(result.line)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              const list = history.current
              if (!list.length) return
              const next = Math.min(list.length - 1, historyAt.current + 1)
              historyAt.current = next
              setDraft(list[list.length - 1 - next] ?? '')
            } else if (event.key === 'ArrowDown') {
              event.preventDefault()
              const next = historyAt.current - 1
              historyAt.current = Math.max(-1, next)
              setDraft(next < 0 ? '' : history.current[history.current.length - 1 - next] ?? '')
            }
          }}
        />
      </div>
    </div>
  )
}

function Prompt({ root, cwd }: { root: string; cwd: string }) {
  return (
    <span className="mr-2 select-none">
      <span className="text-emerald-300">➜</span> <span className="text-sky-300">{prompt(root, cwd)}</span>
      <span className="text-muted"> $</span>
    </span>
  )
}

function ProblemsView({ problems, onReveal }: { problems: Problem[]; onReveal: (problem: Problem) => void }) {
  if (!problems.length) return <p className="px-4 py-8 text-center text-xs text-muted/75">No problems detected.</p>
  return (
    <div className="min-h-0 flex-1 overflow-auto py-1">
      {problems.map((problem) => (
        <button
          key={problem.id}
          type="button"
          onClick={() => onReveal(problem)}
          className="flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-fg/[0.04]"
        >
          {problem.severity === 'error' ? <Bug size={14} className="mt-0.5 shrink-0 text-rose-300" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />}
          <span className="min-w-0">
            <span className="block text-[13px] text-fg">{problem.message}</span>
            <span className="text-[11px] text-muted/75">
              {problem.file ? `${problem.file}${problem.line ? `:${problem.line}` : ''}` : 'preview'} · {problem.source}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}

function ValueView({ value, depth = 0 }: { value: Ser; depth?: number }) {
  const [open, setOpen] = useState(depth === 0 && (value.t === 'object' || value.t === 'array' || value.t === 'error'))
  if (value.t === 'string') return <span className="text-[#e7c4b0]">{value.v}</span>
  if (value.t === 'number' || value.t === 'bigint') return <span className="text-[#b5cea8]">{value.v}</span>
  if (value.t === 'boolean') return <span className="text-[#7aa2f7]">{String(value.v)}</span>
  if (value.t === 'null') return <span className="text-muted/75">null</span>
  if (value.t === 'undefined') return <span className="text-muted/75">undefined</span>
  if (value.t === 'function') return <span className="text-[#dcdcaa]">{value.v}</span>
  if (value.t === 'symbol') return <span className="text-[#c586c0]">{value.v}</span>
  if (value.t === 'element') return <span className="text-[#7dd3c7]">{value.v}</span>
  if (value.t === 'circular') return <span className="text-muted/75">[Circular]</span>
  if (value.t === 'max') return <span className="text-muted/75">…</span>
  if (value.t === 'error') {
    return (
      <span>
        <button type="button" className="text-rose-200" onClick={() => setOpen((value) => !value)}>
          {open ? '▾' : '▸'} {value.name}: {value.message}
        </button>
        {open && value.stack && <span className="mt-1 block whitespace-pre-wrap text-rose-200/80">{value.stack}</span>}
      </span>
    )
  }
  if (value.t === 'array') {
    return (
      <span>
        <button type="button" className="text-fg/80" onClick={() => setOpen((current) => !current)}>
          {open ? '▾' : '▸'} Array({value.length})
        </button>
        {open && (
          <span className="mt-0.5 block pl-4">
            {value.v.map((item, index) => (
              <span key={index} className="block">
                <span className="text-muted/75">{index}: </span>
                <ValueView value={item} depth={depth + 1} />
              </span>
            ))}
          </span>
        )}
      </span>
    )
  }
  return (
    <span>
      <button type="button" className="text-fg/80" onClick={() => setOpen((current) => !current)}>
        {open ? '▾' : '▸'} {value.name}
      </button>
      {open && (
        <span className="mt-0.5 block pl-4">
          {value.v.length === 0 && <span className="text-muted/75">{'{}'}</span>}
          {value.v.map((entry) => (
            <span key={entry.k} className="block">
              <span className="text-[#9cdcfe]">{entry.k}</span>
              <span className="text-muted/75">: </span>
              <ValueView value={entry.v} depth={depth + 1} />
            </span>
          ))}
        </span>
      )}
    </span>
  )
}
