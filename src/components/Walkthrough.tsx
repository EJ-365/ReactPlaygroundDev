import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Logo } from './Logo'

const KEY = 'react-playground.walkthrough'

export function walkthroughDone() {
  try {
    return localStorage.getItem(KEY) === 'done'
  } catch {
    return true
  }
}

type Step = { target?: string; title: string; body: string }

const STEPS: Step[] = [
  {
    title: 'Welcome to Playground',
    body: 'A VS Code-style editor for the whole frontend stack: HTML, CSS, JavaScript, TypeScript, React (JSX/TSX), and Tailwind, with a live preview. It is free and open source, needs no sign-up, and keeps your code in this browser. Built by Ejay Gabriel, frontend developer. This tour takes about 30 seconds.',
  },
  { target: 'header', title: 'Top header', body: 'Switch workspaces here: HTML · CSS · JS, TypeScript, React, and language playgrounds for Python, C++, Java, C#, Go, and Rust (Ctrl+K W cycles through them). Then run, format, share, and download. Click the chevrons on the right (or press Ctrl+K H) to hide the header for more space. A small "Header" button brings it back.' },
  { target: 'sidebar', title: 'Explorer', body: 'Your files and folders. Folders open and close like an accordion. Use the upload buttons, or drag files and whole folders anywhere onto the window to import them. Hover a file or folder to download it.' },
  { target: 'tabs', title: 'Tabs', body: 'The active tab is highlighted with an accent bar. A dot means unsaved changes (only when Auto Save is off). Middle-click or Alt+W closes a tab.' },
  { target: 'editor', title: 'Editor', body: 'The same Monaco editor as VS Code: IntelliSense, Emmet (h2 then Enter, ul>li*3 then Tab), React snippets (rfc, us, ue), Ctrl+click to jump to a definition, and Prettier formatting with Shift+Alt+F. Files with errors turn red in the Explorer.' },
  { target: 'preview', title: 'Live preview', body: 'Updates as you type. Each workspace has its own preview and bottom panel (Ctrl+J: Problems, Output, Debug Console, Terminal): plain index.html, styles.css, and script.js in HTML · CSS · JS, main.ts in TypeScript, main.tsx and App.tsx in React — and the language workspaces, where Python runs via Pyodide (WASM) and C++/Java/C#/Go/Rust run on the Wandbox cloud runner when you press Run. For scripts and languages the preview is a terminal-style output window, and the Debug Console doubles as a REPL. Switch devices or pop the preview into its own window.' },
  { title: 'You are ready', body: 'Ctrl+P opens files, Ctrl+Shift+P opens every command, and Ctrl+K Ctrl+S lists all shortcuts. Your work auto-saves in this browser. Stuck? The book icon in the header opens the Docs and Guides. Want a fresh start? Pick a template.' },
]

export function Walkthrough({ onDone, onTemplates }: { onDone: () => void; onTemplates: () => void }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = STEPS[index]
  const last = index === STEPS.length - 1

  const finish = () => {
    try {
      localStorage.setItem(KEY, 'done')
    } catch {
      // Storage can be unavailable in private windows.
    }
    onDone()
  }

  useLayoutEffect(() => {
    const measure = () => {
      const node = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null
      const box = node?.getBoundingClientRect()
      setRect(box && box.width > 0 && box.height > 0 ? box : null)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [step.target])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish()
      else if (event.key === 'ArrowRight' && !last) setIndex((value) => value + 1)
      else if (event.key === 'ArrowLeft' && index > 0) setIndex((value) => value - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pad = 6
  const card = 340
  let style: CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  if (rect) {
    const below = rect.bottom + 12 + 220 < window.innerHeight
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - card / 2), window.innerWidth - card - 12)
    const wide = rect.width > window.innerWidth * 0.6 && rect.height > window.innerHeight * 0.5
    style = wide
      ? { left: rect.left + 24, top: rect.top + 56 }
      : below
        ? { left, top: rect.bottom + 12 }
        : rect.right + card + 24 < window.innerWidth
          ? { left: rect.right + 12, top: Math.max(12, rect.top + 12) }
          : { left, top: Math.max(12, rect.top - 232) }
  }

  return (
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="Walkthrough" data-testid="walkthrough">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-accent transition-all duration-300"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.6)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}
      <div className="absolute w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-fg/10 bg-elevated p-4 text-fg shadow-2xl" style={style}>
        <div className="flex items-start gap-2">
          <Logo size={18} />
          <h2 className="flex-1 text-sm font-semibold">{step.title}</h2>
          <button type="button" aria-label="Skip walkthrough" onClick={finish} className="rounded p-0.5 text-muted hover:bg-fg/10 hover:text-fg">
            <X size={14} />
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-muted">{step.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="flex gap-1">
            {STEPS.map((item, dot) => (
              <span key={item.title} className={`h-1.5 rounded-full transition-all ${dot === index ? 'w-4 bg-accent' : 'w-1.5 bg-fg/20'}`} />
            ))}
          </span>
          <span className="ml-auto" />
          {index > 0 && (
            <button type="button" onClick={() => setIndex(index - 1)} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted hover:bg-fg/5 hover:text-fg">
              <ArrowLeft size={12} /> Back
            </button>
          )}
          {last ? (
            <>
              <button
                type="button"
                onClick={() => {
                  finish()
                  onTemplates()
                }}
                className="rounded-full border border-fg/15 px-3 py-1 text-xs text-fg hover:bg-fg/5"
              >
                Templates
              </button>
              <button type="button" data-testid="walkthrough-done" onClick={finish} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">
                Start coding
              </button>
            </>
          ) : (
            <button type="button" data-testid="walkthrough-next" onClick={() => setIndex(index + 1)} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">
              {index === 0 ? 'Take the tour' : 'Next'} <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
