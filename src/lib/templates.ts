import { CPP_PROJECT, CSHARP_PROJECT, DEFAULT_ACTIVE, DEFAULT_FILES, DEFAULT_TABS, GO_PROJECT, JAVA_PROJECT, PY_PROJECT, RUST_PROJECT, TS_ACTIVE, TS_FILES, TS_TABS, WEB_FILES } from '../defaults'
import type { SavedProject } from './storage'
import type { WorkspaceId } from './workspace'

export type Template = {
  id: string
  name: string
  description: string
  stack: string[]
  workspace: WorkspaceId
  project: () => SavedProject
}

const TAILWIND = DEFAULT_FILES['tailwind.config.js']

const LANDING_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Landing page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body class="bg-slate-950 text-white">
    <header class="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <span class="text-lg font-bold">Nimbus</span>
      <nav class="hidden gap-6 text-sm text-slate-300 sm:flex">
        <a href="#features" class="hover:text-white">Features</a>
        <a href="#pricing" class="hover:text-white">Pricing</a>
      </nav>
    </header>
    <section class="mx-auto max-w-5xl px-6 py-20 text-center">
      <h1 class="text-5xl font-bold tracking-tight">Ship your idea <span class="text-sky-400">today</span></h1>
      <p class="mx-auto mt-4 max-w-xl text-lg text-slate-300">A landing page built with plain HTML and Tailwind classes.</p>
      <button id="cta" class="mt-8 rounded-full bg-sky-400 px-6 py-3 font-semibold text-slate-950 hover:bg-sky-300">Get started</button>
    </section>
    <section id="features" class="mx-auto grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-3">
      <article class="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 class="font-semibold">Fast</h2><p class="mt-2 text-sm text-slate-400">Loads instantly.</p></article>
      <article class="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 class="font-semibold">Simple</h2><p class="mt-2 text-sm text-slate-400">Just HTML and CSS.</p></article>
      <article class="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 class="font-semibold">Responsive</h2><p class="mt-2 text-sm text-slate-400">Looks good everywhere.</p></article>
    </section>
    <script src="script.js"></script>
  </body>
</html>
`

const LANDING_JS = `document.querySelector('#cta')?.addEventListener('click', () => {
  console.log('Thanks for clicking!')
})
`

const TODO_APP = `import { useState } from 'react'

type Todo = { id: number; text: string; done: boolean }

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Try the playground', done: true },
    { id: 2, text: 'Build something great', done: false },
  ])
  const [text, setText] = useState('')

  const add = () => {
    if (!text.trim()) return
    setTodos((items) => [...items, { id: Date.now(), text: text.trim(), done: false }])
    setText('')
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Todos</h1>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            add()
          }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What needs doing?"
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-violet-400"
          />
          <button className="rounded-xl bg-violet-400 px-4 font-semibold text-slate-950">Add</button>
        </form>
        <ul className="mt-4 space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 rounded-xl bg-black/20 px-3 py-2">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => setTodos((items) => items.map((item) => (item.id === todo.id ? { ...item, done: !item.done } : item)))}
              />
              <span className={todo.done ? 'text-slate-500 line-through' : ''}>{todo.text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-400">{todos.filter((todo) => !todo.done).length} left</p>
      </section>
    </main>
  )
}
`

export const TEMPLATES: Template[] = [
  {
    id: 'react',
    name: 'React + TypeScript',
    description: 'The starter: React 19, TSX components, Tailwind, and a counter.',
    stack: ['React', 'TSX', 'Tailwind'],
    workspace: 'react',
    project: () => ({ files: { ...DEFAULT_FILES }, openTabs: [...DEFAULT_TABS], active: DEFAULT_ACTIVE, folders: ['components'] }),
  },
  {
    id: 'todo',
    name: 'React Todo App',
    description: 'State, forms, and lists in a single TSX component.',
    stack: ['React', 'useState', 'Tailwind'],
    workspace: 'react',
    project: () => ({
      files: {
        'index.html': DEFAULT_FILES['index.html'],
        'styles.css': '/* Global styles */\n',
        'tailwind.config.js': TAILWIND,
        'main.tsx': DEFAULT_FILES['main.tsx'],
        'App.tsx': TODO_APP,
      },
      openTabs: ['index.html', 'styles.css', 'App.tsx'],
      active: 'App.tsx',
      folders: [],
    }),
  },
  {
    id: 'vanilla',
    name: 'HTML, CSS & JavaScript',
    description: 'No framework. A plain page with DOM events and modern CSS.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    workspace: 'web',
    project: () => ({
      files: { ...WEB_FILES },
      openTabs: ['index.html', 'styles.css', 'script.js'],
      active: 'index.html',
      folders: [],
    }),
  },
  {
    id: 'typescript',
    name: 'TypeScript Playground',
    description: 'A standalone main.ts with full type-checking. Runs in the preview and the Terminal — no page markup needed.',
    stack: ['TypeScript', 'Console'],
    workspace: 'ts',
    project: () => ({
      files: { ...TS_FILES },
      openTabs: [...TS_TABS],
      active: TS_ACTIVE,
      folders: [],
    }),
  },
  {
    id: 'python',
    name: 'Python Playground',
    description: 'main.py executed by Pyodide — real CPython in WASM. print() lands in Output, stdlib and multi-file imports work.',
    stack: ['Python', 'Pyodide'],
    workspace: 'python',
    project: PY_PROJECT,
  },
  {
    id: 'cpp',
    name: 'C++ Starter',
    description: 'A main.cpp with IntelliSense and one-click cloud execution — output lands in the Output tab.',
    stack: ['C++', 'Runner'],
    workspace: 'cpp',
    project: CPP_PROJECT,
  },
  {
    id: 'java',
    name: 'Java Starter',
    description: 'A Main.java with IntelliSense and one-click cloud execution — output lands in the Output tab.',
    stack: ['Java', 'Runner'],
    workspace: 'java',
    project: JAVA_PROJECT,
  },
  {
    id: 'csharp',
    name: 'C# Starter',
    description: 'A Program.cs with IntelliSense and one-click cloud execution — output lands in the Output tab.',
    stack: ['C#', 'Runner'],
    workspace: 'csharp',
    project: CSHARP_PROJECT,
  },
  {
    id: 'go',
    name: 'Go Starter',
    description: 'A main.go with IntelliSense and one-click cloud execution — output lands in the Output tab.',
    stack: ['Go', 'Runner'],
    workspace: 'go',
    project: GO_PROJECT,
  },
  {
    id: 'rust',
    name: 'Rust Starter',
    description: 'A main.rs with IntelliSense and one-click cloud execution — output lands in the Output tab.',
    stack: ['Rust', 'Runner'],
    workspace: 'rust',
    project: RUST_PROJECT,
  },
  {
    id: 'landing',
    name: 'Tailwind Landing Page',
    description: 'A responsive marketing page with HTML and Tailwind classes. Includes tailwind.config.js, which turns Tailwind on.',
    stack: ['HTML', 'Tailwind', 'JavaScript'],
    workspace: 'web',
    project: () => ({
      files: { 'index.html': LANDING_HTML, 'styles.css': '/* Extra styles */\n', 'script.js': LANDING_JS, 'tailwind.config.js': TAILWIND },
      openTabs: ['index.html', 'styles.css', 'script.js'],
      active: 'index.html',
      folders: [],
    }),
  },
]
