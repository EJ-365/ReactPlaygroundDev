import { useEffect, type ReactNode } from 'react'
import { SHORTCUTS } from '../components/ShortcutsPanel'
import { FileIcon } from '../components/FileIcon'
import { CREATOR, Code, Kbd, REPO, SiteLayout } from './SiteLayout'

const SECTIONS = [
  { id: 'start', title: 'Getting started' },
  { id: 'structure', title: 'Workspaces' },
  { id: 'languages', title: 'Languages and files' },
  { id: 'editor', title: 'Editor features' },
  { id: 'formatting', title: 'Formatting' },
  { id: 'files', title: 'Upload, save, download' },
  { id: 'preview', title: 'Preview and bottom panel' },
  { id: 'packages', title: 'npm packages' },
  { id: 'themes', title: 'Themes and settings' },
  { id: 'shortcuts', title: 'Keyboard shortcuts' },
  { id: 'install', title: 'Install and share' },
  { id: 'limits', title: 'Limits and FAQ' },
  { id: 'about', title: 'About, license, contact' },
]

export function Docs({ section }: { section?: string }) {
  useEffect(() => {
    if (section) document.getElementById(`doc-${section}`)?.scrollIntoView({ block: 'start' })
  }, [section])

  return (
    <SiteLayout route="docs" brand>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Documentation</p>
          <nav className="flex flex-wrap gap-1 lg:flex-col">
            {SECTIONS.map((item) => (
              <a key={item.id} href={`#/docs/${item.id}`} className={`rounded-md px-2.5 py-1.5 text-sm ${section === item.id ? 'bg-fg/10 text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg'}`}>
                {item.title}
              </a>
            ))}
          </nav>
        </aside>
        <article className="min-w-0 space-y-14 pb-10">
          <header>
            <h1 className="text-4xl font-semibold tracking-tight">Documentation</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted">Everything Playground can do, from a single HTML file to a multi-file React and TypeScript app. Playground is free and open source: no sign-up, no paid plan, no hidden fees.</p>
          </header>

          <Section id="start" title="Getting started">
            <p>New here? You don't need an account or an install. Click <strong>Launch editor</strong> in the top right and start typing; your work is saved in this browser automatically. On your first visit a short walkthrough points out each part of the workbench; you can replay it any time from the command palette with <em>Help: Start Walkthrough</em>.</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Pick a workspace in the header: <strong>HTML · CSS · JS</strong> for plain web pages or <strong>React</strong> for components. <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> <Kbd>W</Kbd> switches between them.</li>
              <li>Edit a file. The preview on the right updates as you type.</li>
              <li>Press <Kbd>Ctrl</Kbd> <Kbd>P</Kbd> to jump between files and <Kbd>Ctrl</Kbd> <Kbd>Shift</Kbd> <Kbd>P</Kbd> for every command.</li>
            </ol>
          </Section>

          <Section id="structure" title="Workspaces">
            <p>Playground has two separate workspaces. Each keeps its own files, open tabs, preview, Output, Debug Console, and saved copy in this browser, so switching never mixes them. Switch with the toggle in the header, <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> <Kbd>W</Kbd>, or <em>Workspace: Switch to…</em> in the command palette. The Explorer shows one tree whose root is the workspace name.</p>
            <h3 className="pt-2 text-lg font-semibold text-fg">HTML · CSS · JS</h3>
            <ul className="space-y-2">
              <FileLine path="index.html">The page. Write a full <code>&lt;html&gt;</code> document or just body markup. Files load exactly like in VS Code and a real browser: only what you link runs. Use <code>&lt;link rel="stylesheet" href="styles.css"&gt;</code> for CSS and <code>&lt;script src="script.js"&gt;</code> for JavaScript (any path, such as <code>css/theme.css</code> or <code>js/app.js</code>). Add <code>defer</code> or <code>type="module"</code> as usual. Inline and CDN tags run as written; a link to a missing file shows in Problems.</FileLine>
              <FileLine path="styles.css">Plain CSS with browser defaults, applied when index.html links it. Add <code>tailwind.config.js</code> to turn on Tailwind classes.</FileLine>
              <FileLine path="script.js">JavaScript that runs where its <code>&lt;script&gt;</code> tag is. Classic scripts share globals, so <code>onclick="like()"</code> works. With <code>type="module"</code> it can <code>import</code> other files and npm packages.</FileLine>
            </ul>
            <p>What your JavaScript prints (<code>console.log</code>, warnings, and errors) shows in the <strong>Output</strong> tab and in the browser's DevTools console (<Kbd>F12</Kbd>). Run a script on its own with <code>node script.js</code> in the <strong>Terminal</strong>. Download gives you a folder that opens directly in a browser.</p>
            <h3 className="pt-2 text-lg font-semibold text-fg">React</h3>
            <p><code>main.tsx</code> (or <code>main.jsx</code>, <code>main.ts</code>, <code>main.js</code>) is the entry; if it is missing, <code>App.tsx</code> is rendered into <code>#root</code>. <code>index.html</code> holds the root element and <code>styles.css</code> holds global styles with Tailwind. Import other files with relative paths:</p>
            <Code>{`// main.tsx
import { createRoot } from 'react-dom/client'
import App from './App'
import './components/card.css'

createRoot(document.getElementById('root')!).render(<App />)`}</Code>
            <p>Download gives you a runnable Vite + React + Tailwind project.</p>
          </Section>

          <Section id="languages" title="Languages and files">
            <p>The preview runs the web stack. Other text files can live in the project for reference, with syntax highlighting and their own file logos.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['index.html', 'HTML: runs in the preview'],
                ['styles.css', 'CSS + Tailwind: runs in the preview'],
                ['script.js', 'JavaScript (.js, .mjs): runs'],
                ['App.jsx', 'JSX: runs, React 19'],
                ['types.ts', 'TypeScript: runs, type-checked in the editor'],
                ['App.tsx', 'TSX: runs, React 19'],
                ['data.json', 'JSON: importable as a module'],
                ['README.md', 'Markdown, SVG, YAML, text: editable'],
                ['main.cpp', 'C/C++, Python, Java, Go, Rust, PHP…: highlighted only'],
                ['theme.scss', 'SCSS, Less, Vue, Svelte: highlighted only'],
              ].map(([path, label]) => (
                <span key={path} className="flex items-center gap-2 rounded-lg border border-fg/10 px-3 py-2 text-sm">
                  <FileIcon path={path} size={16} /> {label}
                </span>
              ))}
            </div>
          </Section>

          <Section id="editor" title="Editor features">
            <ul className="list-disc space-y-1 pl-5">
              <li>IntelliSense for your own files, React types, and Tailwind class names.</li>
              <li>Auto-import: type <code>useSt</code> and pick <code>useState</code> (it shows <code>react</code> next to it). The import is added at the top, or merged into an existing <code>import {'{ … }'} from 'react'</code>. Works for React hooks and APIs, <code>react-dom</code>, and anything exported from your own files.</li>
              <li>Unused variables, parameters, and imports are dimmed like in VS Code. Hover one to see why.</li>
              <li>Picking an attribute in JSX inserts its value too: <code>className=""</code> with the cursor inside the quotes (and Tailwind suggestions open), or <code>onClick={'{}'}</code> for events and non-string props. HTML attributes get <code>class=""</code> the same way.</li>
              <li>Emmet: type <code>h2</code>, <code>ul&gt;li.item*3</code>, or <code>div.card&gt;h2+p</code>, then press <Kbd>Enter</Kbd> on the Emmet suggestion or <Kbd>Tab</Kbd> (HTML, JSX, TSX, CSS).</li>
              <li>Suggestions appear as you type everywhere (JavaScript, TypeScript, JSX markup, HTML, CSS, Tailwind classes). <Kbd>Enter</Kbd> or <Kbd>Tab</Kbd> inserts the highlighted one; <Kbd>Esc</Kbd> closes the list. In JavaScript nothing fills in on its own: no ghost text, and punctuation never accepts. Change this under <em>Settings → JavaScript Suggestions</em>.</li>
              <li>React snippets: <code>rfc</code>, <code>rafce</code>, <code>us</code> (useState), <code>ue</code> (useEffect), <code>ur</code>, <code>um</code>, <code>ucb</code>, <code>jmap</code>, <code>clg</code>.</li>
              <li>Go to definition: <Kbd>Ctrl</Kbd>+click a component, function, or import (or press <Kbd>F12</Kbd>) to open the file where it is defined. Works across <code>.js</code>, <code>.jsx</code>, <code>.ts</code>, and <code>.tsx</code> files.</li>
              <li>Files with errors turn red in the Explorer with an error count (yellow for warnings), and folders containing them get a dot. Error positions also show as marks on the editor scrollbar.</li>
              <li>Auto rename tag: edit an opening tag and its closing tag changes with it (and the other way round), in HTML, JSX, and TSX.</li>
              <li>Auto-close tags and self-closing tags (type <code>/</code> inside a tag). Auto rename, auto-close, and self-closing are each toggleable under <em>Settings → Tags</em>.</li>
              <li>Search across files with regex and replace preview, Outline view, breadcrumbs, sticky scroll, and Zen mode. Inlay hints show return types only (no parameter names), only in <code>.ts</code>/<code>.tsx</code> files, and can be turned off in Settings.</li>
            </ul>
          </Section>

          <Section id="formatting" title="Formatting">
            <p>Press <Kbd>Shift</Kbd> <Kbd>Alt</Kbd> <Kbd>F</Kbd>, click <em>Format</em> in the header, or right-click → <em>Format Document (Prettier)</em>. Prettier formats HTML, CSS, JavaScript, TypeScript, JSX, and TSX. If your code has a syntax error the status bar shows why and nothing changes. Undo with <Kbd>Ctrl</Kbd> <Kbd>Z</Kbd>.</p>
            <p>In <em>Settings → Formatting</em> choose Format On Save, semicolons, single quotes, and print width (80, 100, or 120). Tab size comes from the editor setting.</p>
          </Section>

          <Section id="files" title="Upload, save, download">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>New file / folder:</strong> click the icons at the top of the Explorer, the ones on a folder row, or press <Kbd>Alt</Kbd> <Kbd>N</Kbd> / <Kbd>Alt</Kbd> <Kbd>Shift</Kbd> <Kbd>N</Kbd>. A name box opens in the tree, like VS Code, inside the folder you picked (or the current file's folder). Type a name such as <code>about.html</code> or <code>Card.tsx</code>, press <Kbd>Enter</Kbd> to create it, or <Kbd>Esc</Kbd> to cancel. Clicking away with a valid name creates it too; <code>a/b.js</code> creates folders along the way. New files start empty; type a snippet like <code>rfc</code> or <code>!</code> to scaffold one.</li>
              <li><strong>Upload:</strong> the Explorer upload buttons, <Kbd>Ctrl</Kbd> <Kbd>O</Kbd>, or drag files and folders anywhere onto the window. Folder structure is kept. <code>node_modules</code>, <code>.git</code>, <code>dist</code>, and <code>build</code> are skipped; files over 250 KB and binary files such as images are skipped too.</li>
              <li><strong>Auto Save</strong> is on by default and stores every change in this browser. Turn it off in Settings or the status bar; tabs then show a dot until you press <Kbd>Ctrl</Kbd> <Kbd>S</Kbd>, and the browser warns before closing with unsaved work.</li>
              <li><strong>Download:</strong> hover a file or folder in the Explorer and click the download icon. The header download button (<Kbd>Ctrl</Kbd> <Kbd>Alt</Kbd> <Kbd>S</Kbd>) exports the current workspace: a ready-to-open web folder for HTML/CSS/JS, or a runnable Vite app for React; the command palette also has <em>Download Current File</em> and <em>Download Source Files</em>.</li>
            </ul>
            <Code>{`unzip react-playground.zip && cd react-playground
npm install
npm run dev`}</Code>
          </Section>

          <Section id="preview" title="Preview and bottom panel">
            <p>The preview rebuilds as you type (or press <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd>). Switch between desktop, tablet, and phone widths, or pop it out with the button in the preview toolbar.</p>
            <p>The bottom panel (<Kbd>Ctrl</Kbd> <Kbd>J</Kbd>) has four tabs, like VS Code:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Problems</strong>: build, type, and missing-link errors. Click one to jump to the line.</li>
              <li><strong>Output</strong>: what your page prints with <code>console.log</code>, <code>console.warn</code>, and <code>console.error</code>, plus uncaught errors. It is read-only and clears on each reload unless <em>Preserve log</em> is on.</li>
              <li><strong>Debug Console</strong>: type an expression such as <code>document.title</code> and it runs inside the live page. <Kbd>Shift</Kbd> <Kbd>Enter</Kbd> adds a line; <Kbd>↑</Kbd> recalls earlier input.</li>
              <li><strong>Terminal</strong> (<Kbd>Ctrl</Kbd> <Kbd>`</Kbd>): a shell for your project files. <code>ls</code>, <code>cd</code>, <code>tree</code>, <code>cat</code>, <code>touch</code>, <code>mkdir</code>, <code>rm</code>, <code>mv</code>, <code>cp</code>, <code>echo text &gt; file</code>, and <code>code file</code> work on the Explorer files. <code>node script.js</code> runs a JS or TS file by itself (outside the page, so there is no <code>document</code>) and prints its output; <kbd>Ctrl</kbd>+<kbd>C</kbd> stops it. <code>npm run dev</code> reloads the preview and <code>npm run build</code> lists problems. Type <code>help</code> for the full list.</li>
              <li>The − / + buttons in the panel header change the font size of Output, Debug Console, and Terminal. <Kbd>Ctrl</Kbd> <Kbd>=</Kbd> / <Kbd>Ctrl</Kbd> <Kbd>-</Kbd> / <Kbd>Ctrl</Kbd> <Kbd>0</Kbd> do the same while the panel has focus, and zoom the editor otherwise.</li>
            </ul>
          </Section>

          <Section id="packages" title="npm packages">
            <p>Import any package by name and it is loaded from esm.sh. React and React DOM are shared with your app.</p>
            <Code>{`import confetti from 'canvas-confetti'

document.querySelector('button')?.addEventListener('click', () => confetti())`}</Code>
          </Section>

          <Section id="themes" title="Themes and settings">
            <p>Fifteen themes recolor the whole workbench, including JSX tags, attributes, and bracket pairs. Open the picker with <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> <Kbd>Ctrl</Kbd> <Kbd>T</Kbd>. Settings (<Kbd>Ctrl</Kbd> <Kbd>,</Kbd>) cover fonts and ligatures, minimap, word wrap, tags, Emmet, snippets, formatting, Auto Save, and showing or hiding the top header (<Kbd>Ctrl</Kbd> <Kbd>K</Kbd> <Kbd>H</Kbd>).</p>
          </Section>

          <Section id="shortcuts" title="Keyboard shortcuts">
            <p>On macOS use <Kbd>Cmd</Kbd> wherever you see Ctrl. Browsers reserve Ctrl+N, Ctrl+W, and Ctrl+T in a normal tab, so Alt versions are provided; the Ctrl versions work in the installed app.</p>
            <div className="overflow-hidden rounded-xl border border-fg/10">
              <table className="w-full text-left text-sm">
                <tbody>
                  {SHORTCUTS.map((row) => (
                    <tr key={row.id} className="border-b border-fg/5 last:border-0">
                      <td className="w-1/3 px-4 py-2 font-medium">{row.label}</td>
                      <td className="px-4 py-2">
                        <span className="flex flex-wrap gap-1">{row.keys.map((key, index) => <Kbd key={`${key}-${index}`}>{key}</Kbd>)}</span>
                      </td>
                      <td className="hidden px-4 py-2 text-muted md:table-cell">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="install" title="Install and share">
            <p>In Chrome or Edge, click <em>Install app</em> in the header (or the install icon in the address bar). Playground opens in its own window and the editor loads offline. Installation needs HTTPS or localhost, so use <code>npm run build</code> then <code>npm run preview</code> when running it yourself.</p>
            <p>The share button copies a link that contains the current workspace's project, compressed. It opens straight into the editor, in the same workspace, for whoever receives it. Anyone who opens it gets a copy; they are asked before it replaces their own work. If the browser blocks clipboard access, the link is shown in a box so you can copy it yourself.</p>
          </Section>

          <Section id="limits" title="Limits and FAQ">
            <ul className="list-disc space-y-1 pl-5">
              <li>Projects are stored per browser. Clearing site data removes them, so download anything important.</li>
              <li>Files must be text and under 250 KB each; uploads stop at 400 files.</li>
              <li>SCSS, Vue, Svelte, and non-web languages are highlighted but not compiled in the preview.</li>
              <li>Very large share links may be truncated by some chat apps.</li>
            </ul>
          </Section>

          <Section id="about" title="About, license, contact">
            <p>Playground is created and maintained by <strong>{CREATOR.name}</strong>, {CREATOR.role.toLowerCase()}. It is 100% free and open source under the MIT license: there is no sign-up, no trial, no paid tier, and no hidden fees. Use it, read the code, change it, and share it. The source lives at <a href={REPO.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{REPO.label}</a>; a star there helps others find it.</p>
            <p>Your projects never leave your device unless you share a link or download them. There are no ads and no analytics.</p>
            <p>Bug reports, feature ideas, and questions are welcome at <a href={`mailto:${CREATOR.email}`} className="text-accent hover:underline">{CREATOR.email}</a>.</p>
          </Section>
        </article>
      </div>
    </SiteLayout>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={`doc-${id}`} className="scroll-mt-20 space-y-4 text-[15px] leading-7 text-fg/85 [&_code]:rounded [&_code]:bg-fg/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]">
      <h2 className="text-2xl font-semibold tracking-tight text-fg">{title}</h2>
      {children}
    </section>
  )
}

function FileLine({ path, children }: { path: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-lg border border-fg/10 p-3">
      <FileIcon path={path} size={18} className="mt-1" />
      <span>
        <strong className="font-mono text-sm">{path}</strong>
        <span className="block text-sm text-muted">{children}</span>
      </span>
    </li>
  )
}
