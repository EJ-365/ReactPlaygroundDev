export const DEFAULT_ACTIVE = 'App.tsx'

export const DEFAULT_FILES: Record<string, string> = {
  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + Tailwind</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  'styles.css': `/* Global CSS. Tailwind is always on, and @apply works in this file. */

::selection {
  background: #8b7cff;
  color: white;
}

.glow {
  text-shadow: 0 0 42px rgba(139, 124, 255, 0.45);
}
`,
  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#090b10',
        accent: '#8b7cff',
      },
    },
  },
}
`,
  'main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
  'App.tsx': `import { Counter } from './components/Counter'

const points = [
  ['Live reload', 'The preview refreshes on its own as you type.'],
  ['Tailwind', 'Class IntelliSense works in JSX, HTML, and CSS.'],
  ['Console', 'Logs, warnings, and evaluations land in the panel below.'],
] as const

export default function App() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          React · TypeScript · Tailwind
        </p>
        <h1 className="glow mt-4 max-w-xl text-5xl font-semibold tracking-tight sm:text-6xl">
          A faster way to try an idea.
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-slate-300">
          Edit App.tsx or the components folder. Every change reloads the preview.
        </p>
        <div className="mt-8">
          <Counter />
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {points.map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur"
            >
              <h2 className="font-medium text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
`,
  'components/Counter.tsx': `import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-violet-300"
        onClick={() => {
          const next = count + 1
          setCount(next)
          console.log('Count is', next)
        }}
      >
        Count is {count}
      </button>
      <button
        className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
        onClick={() => console.warn('Warning from the preview')}
      >
        Send a warning
      </button>
      <button
        className="rounded-full border border-rose-400/30 bg-rose-500/10 px-5 py-2.5 text-sm text-rose-100 transition hover:bg-rose-500/20"
        onClick={() => console.error('Error from the preview')}
      >
        Send an error
      </button>
    </div>
  )
}
`,
}

export const DEFAULT_TABS = [
  'index.html',
  'styles.css',
  'App.tsx',
  'main.tsx',
  'components/Counter.tsx',
  'tailwind.config.js',
]

const WEB_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="page">
      <p class="eyebrow">HTML · CSS · JavaScript</p>
      <h1>Hello from plain web code</h1>
      <p class="lead">No framework needed. index.html links styles.css and script.js, just like in VS Code.</p>
      <button id="like" class="button">Likes: <span id="count">0</span></button>
      <ul id="list" class="list"></ul>
    </main>
    <script src="script.js"></script>
  </body>
</html>
`

const WEB_CSS = `:root {
  color-scheme: dark;
  font-family: Inter, system-ui, sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 20% 10%, #312e81, #0b1020 60%);
  color: #f8fafc;
}

.page {
  max-width: 36rem;
  padding: 2rem;
}

.eyebrow {
  color: #a5b4fc;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

h1 {
  font-size: 2.6rem;
  line-height: 1.1;
  margin: 0.5rem 0;
}

.lead {
  color: #cbd5e1;
  line-height: 1.7;
}

.button {
  margin-top: 1rem;
  border: 0;
  border-radius: 999px;
  padding: 0.7rem 1.4rem;
  background: #818cf8;
  color: #0b1020;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.button:hover {
  transform: translateY(-2px);
}

.list li {
  margin-top: 0.4rem;
  color: #cbd5e1;
}
`

const WEB_JS = `const button = document.querySelector('#like')
const count = document.querySelector('#count')
const list = document.querySelector('#list')
let likes = 0

button.addEventListener('click', () => {
  likes += 1
  count.textContent = String(likes)
  const item = document.createElement('li')
  item.textContent = \`Liked at \${new Date().toLocaleTimeString()}\`
  list.prepend(item)
  console.log('Likes:', likes)
})

console.log('script.js loaded')
`

export const WEB_FILES: Record<string, string> = {
  'index.html': WEB_HTML,
  'styles.css': WEB_CSS,
  'script.js': WEB_JS,
}

export const WEB_TABS = ['index.html', 'styles.css', 'script.js']

export const WEB_ACTIVE = 'index.html'
