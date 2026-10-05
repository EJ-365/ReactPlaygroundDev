import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowUpRight, BookOpen, Check, Command, Copy, Download, Link2, Mail, MonitorDown, MousePointer2, WifiOff, X } from 'lucide-react'
import { FileIcon } from '../components/FileIcon'
import { installStore } from '../lib/install'
import { CREATOR, GitHubIcon, GitHubStarButton, Kbd, Logo, REPO, SiteLayout } from './SiteLayout'

type Tok = [string, string]
type Scene = { file: string; lines: Tok[][] }

const C = { kw: 'text-[#c586c0]', fn: 'text-[#dcdcaa]', tag: 'text-[#569cd6]', attr: 'text-[#9cdcfe]', str: 'text-[#ce9178]', comp: 'text-[#4ec9b0]', num: 'text-[#b5cea8]', sel: 'text-[#d7ba7d]', p: 'text-[#d4d4d4]' }

const SCENES: Scene[] = [
  {
    file: 'App.tsx',
    lines: [
      [[C.kw, 'export default function '], [C.fn, 'App'], [C.p, '() {']],
      [[C.kw, '  const '], [C.p, '[count, setCount] = '], [C.fn, 'useState'], [C.p, '('], [C.num, '0'], [C.p, ')']],
      [[C.kw, '  return '], [C.p, '(']],
      [[C.tag, '    <button '], [C.attr, 'className'], [C.p, '='], [C.str, '"btn"'], [C.attr, ' onClick'], [C.p, '={() => '], [C.fn, 'setCount'], [C.p, '(count + '], [C.num, '1'], [C.p, ')}'], [C.tag, '>']],
      [[C.p, '      Clicked {count} times']],
      [[C.tag, '    </button>']],
      [[C.p, '  )']],
      [[C.p, '}']],
    ],
  },
  {
    file: 'index.html',
    lines: [
      [[C.tag, '<section '], [C.attr, 'class'], [C.p, '='], [C.str, '"card"'], [C.tag, '>']],
      [[C.tag, '  <h1>'], [C.p, 'Hello, web'], [C.tag, '</h1>']],
      [[C.tag, '  <p>'], [C.p, 'Edited live in your browser.'], [C.tag, '</p>']],
      [[C.tag, '  <a '], [C.attr, 'href'], [C.p, '='], [C.str, '"#"'], [C.tag, '>'], [C.p, 'Get started'], [C.tag, '</a>']],
      [[C.tag, '</section>']],
    ],
  },
  {
    file: 'styles.css',
    lines: [
      [[C.sel, '.card'], [C.p, ' {']],
      [[C.attr, '  background'], [C.p, ': '], [C.str, '#c6ff3d'], [C.p, ';']],
      [[C.attr, '  border-radius'], [C.p, ': '], [C.num, '20px'], [C.p, ';']],
      [[C.attr, '  padding'], [C.p, ': '], [C.num, '28px'], [C.p, ';']],
      [[C.attr, '  transform'], [C.p, ': '], [C.fn, 'rotate'], [C.p, '('], [C.num, '-2deg'], [C.p, ');']],
      [[C.p, '}']],
    ],
  },
]

const sceneText = (scene: Scene) => scene.lines.map((line) => line.map(([, text]) => text).join('')).join('\n')

function useReducedMotion() {
  const [reduced] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  return reduced
}

function useReveal() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const nodes = root.current?.querySelectorAll<HTMLElement>('[data-reveal]') ?? []
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const node = entry.target
          if (node instanceof HTMLElement) node.dataset.shown = 'true'
          observer.unobserve(node)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])
  return root
}

function useTicker(length: number, ms: number) {
  const [index, setIndex] = useState(0)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % length), ms)
    return () => window.clearInterval(timer)
  }, [length, ms, reduced])
  return index
}

function delay(ms: number): CSSProperties {
  return { '--delay': `${ms}ms` } as CSSProperties
}

export function Landing() {
  const root = useReveal()
  return (
    <SiteLayout route="home" brand>
      <div ref={root}>
        <Hero />
        <Marquee />
        <Stats />
        <Workbench />
        <HowItRuns />
        <FreeForever />
        <Creator />
        <Faq />
        <FinalCta />
      </div>
    </SiteLayout>
  )
}

function Eyebrow({ index, children, className = '' }: { index: string; children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-3 font-code text-[11px] uppercase tracking-[0.2em] text-muted ${className}`}>
      <span className="text-accent">{index}</span>
      <span className="h-px w-8 bg-fg/20" />
      {children}
    </p>
  )
}

function Hero() {
  const section = useRef<HTMLElement>(null)
  return (
    <section
      ref={section}
      className="relative isolate overflow-hidden"
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--mx', `${event.clientX - box.left}px`)
        event.currentTarget.style.setProperty('--my', `${event.clientY - box.top}px`)
      }}
    >
      <div className="site-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="site-spotlight pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:pb-24">
        <div className="max-w-4xl">
          <p data-reveal className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.03] py-1 pl-1.5 pr-3 font-code text-[11px] text-muted">
            <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-fg">v1.0</span>
            open source · MIT · runs 100% in your browser
          </p>
          <h1 data-reveal style={delay(80)} className="mt-6 font-display text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[92px]">
            Your code editor,
            <br />
            <span className="font-serif text-[1.08em] font-normal italic tracking-[-0.02em] text-accent">minus the setup.</span>
          </h1>
          <p data-reveal style={delay(160)} className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Playground is a VS Code-style workbench for HTML, CSS, JavaScript, TypeScript, React and Tailwind — plus Python, C++, Java, C#, Go and Rust workspaces that really run (Python via Pyodide in your tab, the rest on a cloud code runner), each with a terminal-style output window and a REPL. Open a tab, start typing, and watch it render. Nothing to install, no account to make, and it never costs a cent.
          </p>
          <div data-reveal style={delay(240)} className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#/app" data-testid="hero-launch" className="group flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_rgb(var(--c-accent))]">
              Launch the editor <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a href="#/guide" className="flex items-center gap-2 rounded-lg border border-fg/15 px-5 py-3 text-sm font-medium transition hover:border-fg/30 hover:bg-fg/[0.04]">
              <BookOpen size={16} /> First-timer guide
            </a>
            <GitHubStarButton size="lg" />
            <button
              type="button"
              onClick={() => {
                if (installStore.get() === 'available') void installStore.prompt()
                else location.hash = '#/docs/install'
              }}
              className="flex items-center gap-2 px-3 py-3 text-sm text-muted transition hover:text-fg"
            >
              <MonitorDown size={16} /> Install on desktop
            </button>
          </div>
          <ul data-reveal style={delay(320)} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-code text-[12px] text-muted">
            {['$0 forever', 'no sign-up', 'no hidden fees', 'code stays on your device'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check size={13} className="text-accent" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal style={delay(380)} className="mt-14 lg:mt-20">
          <LiveDemo />
        </div>
      </div>
    </section>
  )
}

function LiveDemo() {
  const reduced = useReducedMotion()
  const [scene, setScene] = useState(0)
  const [count, setCount] = useState(() => (reduced ? sceneText(SCENES[0]).length : 0))
  const [clicks, setClicks] = useState(0)
  const current = SCENES[scene]
  const text = sceneText(current)
  const done = count >= text.length

  useEffect(() => {
    if (reduced) return
    if (!done) {
      const timer = window.setTimeout(() => setCount((value) => Math.min(text.length, value + (Math.random() > 0.7 ? 2 : 1))), 26 + Math.random() * 34)
      return () => window.clearTimeout(timer)
    }
    const tick = window.setInterval(() => setClicks((value) => value + 1), 700)
    const next = window.setTimeout(() => {
      setScene((value) => (value + 1) % SCENES.length)
      setCount(0)
      setClicks(0)
    }, 3400)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(next)
    }
  }, [count, done, reduced, text.length])

  const progress = count / text.length
  const typed = text.slice(0, count)
  const line = typed.split('\n').length
  const column = typed.length - typed.lastIndexOf('\n')
  let left = count

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-fg/20 via-fg/5 to-transparent" />
      <div className="relative overflow-hidden rounded-2xl border border-fg/10 bg-[#0d0f14] shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]" data-testid="hero-demo">
        <div className="flex h-10 items-center gap-2 border-b border-white/[0.07] bg-[#0a0c10] px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="ml-3 flex min-w-0 gap-0.5 overflow-hidden">
            {SCENES.map((item, index) => (
              <span key={item.file} className={`flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-1.5 text-[11px] transition-colors ${index === scene ? 'bg-[#0d0f14] text-white' : 'text-white/40'}`}>
                <FileIcon path={item.file} size={12} /> {item.file}
              </span>
            ))}
          </div>
          <span className="ml-auto hidden items-center gap-1.5 font-code text-[10px] text-white/40 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> live
          </span>
        </div>
        <div className="grid md:grid-cols-[1.35fr_1fr]">
          <div className="relative min-h-[230px] overflow-hidden sm:min-h-[260px]">
            <div className="site-scan pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-accent/[0.035] to-transparent" />
            <pre className="overflow-x-auto p-4 font-code text-[11px] leading-6 text-[#d4d4d4] sm:p-5 sm:text-[12.5px]">
              {current.lines.map((tokens, row) => {
                if (row > 0) left -= 1
                const rendered = tokens.map(([cls, value], index) => {
                  const shown = value.slice(0, Math.max(0, left))
                  left -= value.length
                  return shown ? <span key={index} className={cls}>{shown}</span> : null
                })
                return (
                  <div key={row} className="flex">
                    <span className="mr-4 w-5 shrink-0 select-none text-right text-white/20">{row + 1}</span>
                    <span className="whitespace-pre">
                      {rendered}
                      {row === line - 1 && !reduced && <span className="site-caret ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-accent" />}
                    </span>
                  </div>
                )
              })}
            </pre>
          </div>
          <div className="relative grid min-h-[200px] place-items-center border-t border-white/[0.07] bg-[radial-gradient(circle_at_30%_20%,#1a1f2b,#0b0d12)] p-6 md:border-l md:border-t-0">
            <span className="absolute left-3 top-3 font-code text-[10px] text-white/30">preview.local</span>
            <DemoPreview scene={scene} progress={progress} clicks={clicks} />
          </div>
        </div>
        <div className="flex h-6 items-center gap-4 bg-accent px-3 font-code text-[10px] text-accent-fg">
          <span>● {done ? 'Compiled' : 'Typing…'}</span>
          <span className="hidden sm:inline">Auto Save: On</span>
          <span className="ml-auto">
            Ln {line}, Col {column}
          </span>
          <span className="hidden sm:inline">{current.file.endsWith('.tsx') ? 'TypeScript React' : current.file.endsWith('.css') ? 'CSS' : 'HTML'}</span>
        </div>
      </div>
    </div>
  )
}

function DemoPreview({ scene, progress, clicks }: { scene: number; progress: number; clicks: number }) {
  if (scene === 0) {
    return (
      <button type="button" tabIndex={-1} className={`rounded-lg border border-white/15 bg-white/[0.06] px-5 py-2.5 font-display text-sm text-white transition-all duration-500 ${progress > 0.5 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        Clicked <span className="font-code text-accent">{progress >= 1 ? clicks : 0}</span> times
      </button>
    )
  }
  const styled = scene === 2
  const step = (at: number) => (styled || progress > at ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
  return (
    <div
      className="w-full max-w-[240px] transition-all duration-700"
      style={{
        background: styled && progress > 0.25 ? '#c6ff3d' : 'transparent',
        color: styled && progress > 0.25 ? '#0a0c08' : '#fff',
        borderRadius: styled && progress > 0.45 ? 20 : 0,
        padding: styled && progress > 0.62 ? 28 : 4,
        transform: styled && progress > 0.85 ? 'rotate(-2deg)' : 'none',
      }}
    >
      <h3 className={`font-display text-2xl font-semibold tracking-tight transition-all duration-500 ${step(0.3)}`}>Hello, web</h3>
      <p className={`mt-1 text-sm opacity-70 transition-all duration-500 ${step(0.6)}`}>Edited live in your browser.</p>
      <span className={`mt-3 inline-block text-sm font-medium underline underline-offset-4 transition-all duration-500 ${step(0.88)}`}>Get started</span>
    </div>
  )
}

const STACK: { file: string; label: string }[] = [
  { file: 'index.html', label: 'HTML' },
  { file: 'styles.css', label: 'CSS' },
  { file: 'script.js', label: 'JavaScript' },
  { file: 'types.ts', label: 'TypeScript' },
  { file: 'App.jsx', label: 'JSX' },
  { file: 'App.tsx', label: 'TSX' },
  { file: 'tailwind.config.js', label: 'Tailwind' },
  { file: 'data.json', label: 'JSON' },
  { file: 'README.md', label: 'Markdown' },
  { file: 'main.scss', label: 'SCSS' },
  { file: 'main.py', label: 'Python' },
  { file: 'main.rs', label: 'Rust' },
  { file: 'main.go', label: 'Go' },
  { file: 'Main.java', label: 'Java' },
  { file: 'app.kt', label: 'Kotlin' },
  { file: 'main.swift', label: 'Swift' },
  { file: 'app.dart', label: 'Dart' },
  { file: 'index.php', label: 'PHP' },
  { file: 'app.dockerfile', label: 'Dockerfile' },
  { file: 'main.tf', label: 'Terraform' },
  { file: 'token.sol', label: 'Solidity' },
  { file: 'schema.proto', label: 'Protobuf' },
  { file: 'api.rb', label: 'Ruby' },
  { file: 'tool.ps1', label: 'PowerShell' },
]

function Marquee() {
  return (
    <section className="relative overflow-hidden border-y border-fg/[0.08] py-5" aria-label="Supported languages">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-app to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-app to-transparent" />
      <div className="site-marquee flex w-max gap-12">
        {[...STACK, ...STACK].map((item, index) => (
          <span key={index} className="flex items-center gap-2.5 font-code text-sm text-fg/60" aria-hidden={index >= STACK.length}>
            <FileIcon path={item.file} size={18} /> {item.label}
          </span>
        ))}
      </div>
    </section>
  )
}

function CountUp({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const [value, setValue] = useState(reduced ? to : 0)
  useEffect(() => {
    if (reduced || !ref.current) return
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 1200)
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))))
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    })
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [reduced, to])
  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  )
}

function Stats() {
  const items = [
    { value: <CountUp to={0} />, label: 'accounts needed' },
    { value: <CountUp to={0} prefix="$" />, label: 'now, later, ever' },
    { value: <CountUp to={100} suffix="%" />, label: 'open source, MIT' },
    { value: <CountUp to={15} />, label: 'editor themes' },
  ]
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.label} data-reveal style={delay(index * 90)} className={`border-fg/[0.08] py-10 ${index % 2 ? 'pl-6' : 'pr-6'} ${index < 2 ? 'border-b lg:border-b-0' : ''} ${index % 2 === 0 ? 'border-r' : ''} lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0`}>
          <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">{item.value}</p>
          <p className="mt-2 font-code text-[12px] text-muted">{item.label}</p>
        </div>
      ))}
    </section>
  )
}

function Tile({ className = '', title, body, children, index }: { className?: string; title: string; body: string; children: ReactNode; index: number }) {
  return (
    <div data-reveal style={delay(index * 70)} className={`group relative flex flex-col overflow-hidden rounded-2xl border border-fg/[0.09] bg-sidebar/70 transition-colors duration-300 hover:border-fg/20 ${className}`}>
      <div className="relative min-h-[240px] flex-1 overflow-hidden border-b border-fg/[0.07] bg-editor/60">{children}</div>
      <div className="p-5">
        <h3 className="font-display text-[17px] font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted">{body}</p>
      </div>
    </div>
  )
}

const COMMANDS = [
  ['Format Document', 'Shift+Alt+F'],
  ['Go to Definition', 'F12'],
  ['View: Toggle Zen Mode', 'Ctrl+K Z'],
  ['Workspace: Switch to React', 'Ctrl+K W'],
  ['Preferences: Color Theme', 'Ctrl+K Ctrl+T'],
]

function PaletteDemo() {
  const active = useTicker(COMMANDS.length, 1500)
  return (
    <div className="absolute inset-0 grid place-items-center p-5">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-fg/10 bg-elevated shadow-2xl">
        <div className="flex items-center gap-2 border-b border-fg/10 px-3 py-2.5 font-code text-[12px]">
          <Command size={13} className="text-muted" />
          <span className="text-fg">&gt;</span>
          <span className="text-fg/80">{COMMANDS[active][0].toLowerCase().slice(0, 6)}</span>
          <span className="site-caret h-3.5 w-px bg-accent" />
        </div>
        {COMMANDS.map(([label, keys], index) => (
          <div key={label} className={`flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors duration-300 ${index === active ? 'bg-accent/15 text-fg' : 'text-fg/60'}`}>
            <span>{label}</span>
            <span className="font-code text-[10.5px] text-muted">{keys}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PALETTES = [
  { name: 'Dark+', bg: '#1e1e1e', kw: '#c586c0', fn: '#dcdcaa', tag: '#569cd6', str: '#ce9178' },
  { name: 'Dracula', bg: '#282a36', kw: '#ff79c6', fn: '#50fa7b', tag: '#ff79c6', str: '#f1fa8c' },
  { name: 'Tokyo Night', bg: '#1a1b26', kw: '#bb9af7', fn: '#7aa2f7', tag: '#f7768e', str: '#9ece6a' },
  { name: 'Catppuccin', bg: '#1e1e2e', kw: '#cba6f7', fn: '#89b4fa', tag: '#89dceb', str: '#a6e3a1' },
  { name: "SynthWave '84", bg: '#262335', kw: '#fede5d', fn: '#36f9f6', tag: '#ff7edb', str: '#ff8b39' },
]

function ThemeDemo() {
  const theme = PALETTES[useTicker(PALETTES.length, 1800)]
  return (
    <div className="absolute inset-0 p-5 transition-colors duration-700" style={{ background: theme.bg }}>
      <span className="absolute right-4 top-4 rounded-full border border-white/15 px-2 py-0.5 font-code text-[10px] text-white/70">{theme.name}</span>
      <pre className="font-code text-[12px] leading-6 text-white/80">
        <span style={{ color: theme.kw }} className="transition-colors duration-700">const</span> <span style={{ color: theme.fn }} className="transition-colors duration-700">Card</span> = () =&gt; ({'\n'}
        {'  '}<span style={{ color: theme.tag }} className="transition-colors duration-700">&lt;div</span> className=<span style={{ color: theme.str }} className="transition-colors duration-700">"card"</span><span style={{ color: theme.tag }} className="transition-colors duration-700">&gt;</span>{'\n'}
        {'    '}<span style={{ color: theme.tag }} className="transition-colors duration-700">&lt;h2&gt;</span>Themes<span style={{ color: theme.tag }} className="transition-colors duration-700">&lt;/h2&gt;</span>{'\n'}
        {'  '}<span style={{ color: theme.tag }} className="transition-colors duration-700">&lt;/div&gt;</span>{'\n'})
      </pre>
    </div>
  )
}

const TERMINAL: [string, string][] = [
  ['ls', 'index.html  styles.css  script.js'],
  ['node script.js', 'sum = 42'],
  ['python main.py', 'avg = 89.25'],
  ['go run main.go', 'hello, runner'],
]

function TerminalDemo() {
  const ticker = useTicker(TERMINAL.length + 2, 1100)
  const step = useReducedMotion() ? TERMINAL.length : ticker
  return (
    <pre className="absolute inset-0 p-5 font-code text-[12px] leading-6 text-fg/80">
      {TERMINAL.slice(0, Math.min(step + 1, TERMINAL.length)).map(([command, output], index) => (
        <span key={command} className="animate-pop block">
          <span className="text-accent">➜</span> <span className="text-[#5be1ff]">~/web</span> $ {command}
          {'\n'}
          <span className={index < step ? 'text-muted' : 'opacity-0'}>{output}</span>
        </span>
      ))}
    </pre>
  )
}

function DiagnosticsDemo() {
  return (
    <div className="absolute inset-0 grid grid-cols-[110px_1fr] font-code text-[11.5px]">
      <div className="space-y-1 border-r border-fg/[0.07] p-3 text-fg/70">
        <p>App.jsx</p>
        <p className="flex justify-between text-rose-400">
          Card.jsx <span>1</span>
        </p>
        <p>main.jsx</p>
      </div>
      <div className="relative p-3 leading-6 text-fg/80">
        <p>
          <span className="text-[#c586c0]">return</span> &lt;div&gt;
        </p>
        <p className="underline decoration-rose-400 decoration-wavy underline-offset-4">{'  {title'}</p>
        <p>&lt;/div&gt;</p>
        <span className="absolute right-1 top-9 h-3 w-1 rounded-sm bg-rose-400" />
        <p className="mt-3 rounded border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[10.5px] text-rose-300">{"'}' expected."}</p>
      </div>
    </div>
  )
}

function DefinitionDemo() {
  const ticker = useTicker(2, 1700)
  const jumped = useReducedMotion() || ticker === 1
  return (
    <div className="absolute inset-0 p-5 font-code text-[12px] leading-6">
      <p className={`transition-opacity duration-300 ${jumped ? 'opacity-30' : ''}`}>
        <span className="text-[#c586c0]">return</span> <span className="text-[#569cd6]">&lt;</span>
        <span className="relative text-[#4ec9b0] underline underline-offset-4">
          Hello
          <MousePointer2 size={14} className="absolute -bottom-4 left-3 fill-white text-black" />
        </span>{' '}
        <span className="text-[#569cd6]">/&gt;</span>
      </p>
      <div className={`mt-6 rounded-lg border border-accent/30 bg-accent/[0.06] p-3 transition-all duration-500 ${jumped ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
        <p className="flex items-center gap-1.5 text-[10.5px] text-muted">
          <FileIcon path="Hello.jsx" size={11} /> Hello.jsx
        </p>
        <p>
          <span className="text-[#c586c0]">export default function</span> <span className="text-[#dcdcaa]">Hello</span>()
        </p>
      </div>
    </div>
  )
}

function Workbench() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
      <div data-reveal>
        <Eyebrow index="01">The workbench</Eyebrow>
        <h2 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Everything where your hands <span className="font-serif font-normal italic text-accent">already expect it.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-muted">The real Monaco editor behind VS Code, wired to a live preview, a terminal, and the shortcuts you already know.</p>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Tile index={0} className="sm:col-span-2 lg:col-span-4" title="Command palette, quick open, Zen mode" body="Ctrl+Shift+P for every command, Ctrl+P for files, Ctrl+K Z to hide everything but the code. A searchable shortcut list is one keystroke away.">
          <PaletteDemo />
        </Tile>
        <Tile index={1} className="lg:col-span-2" title="15 themes that color everything" body="Dark+, Dracula, Tokyo Night, Catppuccin, SynthWave and more. Every one gives JSX tags their own color.">
          <ThemeDemo />
        </Tile>
        <Tile index={2} className="lg:col-span-2" title="A terminal for your files" body="ls, cat, touch, mkdir, node script.js, python main.py — next to Problems, Output and a Debug Console that doubles as a REPL.">
          <TerminalDemo />
        </Tile>
        <Tile index={3} className="lg:col-span-2" title="Errors you can't miss" body="Red squiggles, a red mark on the scrollbar, and a red file in the Explorer with an error count.">
          <DiagnosticsDemo />
        </Tile>
        <Tile index={4} className="sm:col-span-2 lg:col-span-2" title="Ctrl+click to jump" body="Go to definition across .js, .jsx, .ts and .tsx. Auto-imports, auto rename tags and Emmet included.">
          <DefinitionDemo />
        </Tile>
      </div>
      <div data-reveal className="mt-4 grid gap-4 rounded-2xl border border-fg/[0.09] bg-sidebar/70 p-6 sm:grid-cols-3">
        {[
          { icon: <Download size={18} />, title: 'Download a real project', body: 'One file, a folder, or a runnable Vite app.' },
          { icon: <Link2 size={18} />, title: 'Share in one link', body: 'The whole project is packed into the URL.' },
          { icon: <WifiOff size={18} />, title: 'Install and go offline', body: 'Install from Chrome or Edge for its own window.' },
        ].map((item) => (
          <div key={item.title} className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-fg/10 text-accent">{item.icon}</span>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="mt-0.5 text-sm text-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItRuns() {
  const steps = [
    { tag: 'compile', title: 'esbuild runs in your tab', body: 'TypeScript, JSX and imports are bundled by esbuild compiled to WebAssembly, right inside the page. Python runs on Pyodide (CPython in WASM); C++, Java, C#, Go and Rust run on the Wandbox cloud runner. No build server.' },
    { tag: 'render', title: 'A sandboxed live preview', body: 'Output renders in an isolated frame next to the editor, with console logs piped to Output — and script/language workspaces get a terminal-style output window plus a Debug Console REPL.' },
    { tag: 'persist', title: 'Saved on your device', body: 'Projects live in your browser storage. Nothing is uploaded unless you choose to share a link.' },
  ]
  return (
    <section className="border-y border-fg/[0.08] bg-sidebar/40">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div data-reveal>
          <Eyebrow index="02">How it runs</Eyebrow>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">No servers. No installs. Just a tab.</h2>
        </div>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <span data-reveal className="absolute left-0 right-0 top-[15px] hidden h-px origin-left bg-gradient-to-r from-accent via-fg/20 to-transparent md:block" />
          {steps.map((step, index) => (
            <li key={step.tag} data-reveal style={delay(index * 120)} className="relative">
              <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-fg/15 bg-app px-3 py-1 font-code text-[11px] text-fg">
                <span className="text-accent">0{index + 1}</span> {step.tag}
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function FreeForever() {
  const gone = ['Sign-up walls', 'Trials that expire', 'A "Pro" tier', 'Ads and analytics', 'Hidden fees']
  return (
    <section className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
      <div data-reveal>
        <Eyebrow index="03">Free means free</Eyebrow>
        <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          100% free.
          <br />
          <span className="font-serif font-normal italic text-accent">100% open source.</span>
        </h2>
        <p className="mt-5 max-w-lg text-muted">Playground is MIT licensed. Use it, read the code, change it, ship your own copy. There is nothing to unlock and no account to create.</p>
        <a href={REPO.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 font-code text-[13px] text-fg/80 transition hover:text-accent" data-testid="free-github">
          <GitHubIcon size={15} /> {REPO.label} <ArrowUpRight size={14} />
        </a>
        <ul className="mt-8 space-y-3" data-testid="free-list">
          {gone.map((item, index) => (
            <li key={item} data-reveal style={delay(200 + index * 120)} className="flex items-center gap-3 font-display text-xl text-fg/50 sm:text-2xl">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-fg/15 text-muted">
                <X size={12} />
              </span>
              <span className="relative">
                {item}
                <span className="site-strike absolute left-0 right-0 top-1/2 h-[2px] origin-left scale-x-0 bg-accent" style={delay(400 + index * 120)} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div data-reveal style={delay(150)} className="self-center">
        <div className="overflow-hidden rounded-2xl border border-fg/10 bg-editor">
          <div className="flex items-center gap-2 border-b border-fg/[0.07] px-4 py-2.5 font-code text-[11px] text-muted">
            <FileIcon path="LICENSE.md" size={12} /> LICENSE
          </div>
          <pre className="whitespace-pre-wrap p-5 font-code text-[12px] leading-6 text-fg/75">
            <span className="text-fg">MIT License</span>
            {'\n\n'}Copyright (c) 2026 <span className="text-accent">{CREATOR.name}</span>
            {'\n\n'}Permission is hereby granted, <span className="text-fg">free of charge</span>, to any person obtaining a copy of this software… to use, copy, modify, merge, publish, distribute…
          </pre>
        </div>
      </div>
    </section>
  )
}

function Creator() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CREATOR.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      location.href = `mailto:${CREATOR.email}`
    }
  }
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8" id="creator">
      <div data-reveal className="relative overflow-hidden rounded-3xl border border-fg/10 bg-sidebar/70 p-8 sm:p-12">
        <div className="site-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative grid items-center gap-10 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-36 w-36 md:mx-0 sm:h-44 sm:w-44">
            <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-fg/10">
              <div className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2">
                <div className="h-full w-full animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgb(var(--c-accent))_70deg,#5be1ff_140deg,transparent_200deg)] motion-reduce:animate-none" />
              </div>
            </div>
            <div className="absolute inset-[2px] grid place-items-center rounded-[26px] bg-app">
              <span className="font-serif text-6xl italic text-fg sm:text-7xl">EG</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <Eyebrow index="04" className="justify-center md:justify-start">
              The maker
            </Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" data-testid="creator-name">
              Built by {CREATOR.name}.
            </h2>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.08] px-3 py-1 font-code text-[12px] text-accent" data-testid="creator-role">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {CREATOR.role}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-muted md:mx-0">Playground is designed and built by {CREATOR.name}, a {CREATOR.role.toLowerCase()} who wanted VS Code in a tab with zero setup. Found a bug, want a feature, or just want to say hi? Send an email.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
              <a href={`mailto:${CREATOR.email}`} data-testid="creator-email" className="flex items-center gap-2 rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-app transition hover:bg-accent hover:text-accent-fg">
                <Mail size={15} /> {CREATOR.email}
              </a>
              <button type="button" onClick={() => void copy()} className="flex items-center gap-2 rounded-lg border border-fg/15 px-4 py-2.5 text-sm transition hover:bg-fg/[0.05]">
                {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FAQ = [
  { q: 'Is it really free?', a: 'Yes. There is no paid plan, no trial, no sign-up and no hidden fees. Playground is open source under the MIT license.' },
  { q: 'Is it only for React?', a: 'No. The header switches between workspaces — HTML · CSS · JS for plain web pages, TypeScript for standalone typed scripts, React for components, plus Python, C++, Java, C#, Go, and Rust, all of which run (Python via Pyodide in your browser; the rest on a cloud code runner) — each with its own files, preview, Output, and Terminal.' },
  { q: 'Where is my code stored?', a: 'In your browser (localStorage). Nothing is uploaded to a server. Download the project or share a link to move it elsewhere.' },
  { q: 'Can I use npm packages?', a: 'Yes. Bare imports such as import confetti from "canvas-confetti" load from esm.sh automatically.' },
  { q: 'Does it work offline?', a: 'Install it as an app and the editor opens without a connection. Packages from esm.sh, the first Pyodide download, and the Wandbox runner need the network.' },
  { q: 'Who made it?', a: `${CREATOR.name}, ${CREATOR.role.toLowerCase()}. Questions and ideas are welcome at ${CREATOR.email}.` },
]

function Faq() {
  return (
    <section className="border-t border-fg/[0.08]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
        <div data-reveal>
          <Eyebrow index="05">Questions</Eyebrow>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.03em]">Asked and answered.</h2>
          <p className="mt-3 text-muted">
            More in the{' '}
            <a href="#/docs" className="text-fg underline decoration-accent underline-offset-4 hover:text-accent">
              documentation
            </a>
            .
          </p>
        </div>
        <div className="divide-y divide-fg/[0.08] border-y border-fg/[0.08]">
          {FAQ.map((item, index) => (
            <details key={item.q} data-reveal style={delay(index * 60)} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-medium">
                {item.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-fg/15 text-muted transition group-open:rotate-45 group-open:border-accent group-open:text-accent">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-fg/[0.08]">
      <div className="site-grid pointer-events-none absolute inset-0" />
      <div data-reveal className="relative mx-auto flex max-w-7xl flex-col items-center px-5 py-28 text-center sm:px-8">
        <Logo size={64} />
        <h2 className="mt-8 font-display text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">
          Open a tab.
          <br />
          <span className="font-serif font-normal italic text-accent">Start building.</span>
        </h2>
        <p className="mt-5 text-muted">
          <Kbd>Ctrl</Kbd> <Kbd>P</Kbd> for files · <Kbd>Ctrl</Kbd> <Kbd>Shift</Kbd> <Kbd>P</Kbd> for commands
        </p>
        <a href="#/app" className="group mt-9 flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-accent-fg transition hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_rgb(var(--c-accent))]">
          Launch the editor, it's free <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </section>
  )
}
