<div align="center">

<img src="public/icons/icon-512.png" alt="Playground logo" width="96" height="96" />

# Playground

**A VS Code-style frontend editor that runs entirely in your browser.**

Write HTML, CSS, JavaScript, TypeScript, React (JSX/TSX) and Tailwind with a live preview, a real
editor engine, a terminal and an error panel. Nothing to install, no account, and it costs nothing.

[![License: MIT](https://img.shields.io/badge/license-MIT-c6ff3d.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/EJ-365/ReactPlagroundDev?style=flat&color=5be1ff)](https://github.com/EJ-365/ReactPlagroundDev/stargazers)
![React 19](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Vite](https://img.shields.io/badge/Vite-7-646cff)
![Monaco](https://img.shields.io/badge/Monaco_Editor-0.53-0078d4)

[Live demo](#live-demo) · [Features](#features) · [Getting started](#getting-started) · [Shortcuts](#keyboard-shortcuts) · [Deploy](#deploying) · [Contributing](#contributing)

</div>

---

## Why Playground?

Trying out a component, teaching someone HTML, or sketching a UI idea usually means creating a
project, installing packages and waiting for a dev server. Playground skips all of that: open a tab
and you get an editor that behaves like VS Code, with a live preview next to it.

- **100% free and open source** (MIT). No sign-up, no trial, no paid tier, no ads, no hidden fees.
- **Private by default.** Your code stays in your browser's local storage. It only leaves your
  device if you share a link or download the project.
- **The whole frontend stack**, not just React: plain HTML/CSS/JS, TypeScript, JSX/TSX and Tailwind.
- **Installable.** Add it to your desktop from Chrome or Edge and it opens in its own window, even offline.

## Live demo

> [https://reactplagrounddev.ej-365.workers.dev/](https://reactplagrounddev.ej-365.workers.dev/)

## Features

### Two workspaces

Switch with the **HTML · CSS · JS | React** toggle in the header (or `Ctrl+K` then `W`).
Each workspace keeps its own files, open tabs, preview and console.

| Workspace | What it runs | Download format |
| --- | --- | --- |
| **HTML · CSS · JS** | Plain `index.html` + `styles.css` + `script.js`, no framework. Files load exactly like a real browser: only what `index.html` links with `<link href>` and `<script src>` runs. `defer`, `type="module"` and `import` between your files all work. | A folder you can open straight in a browser |
| **React** | React 19 with JSX/TSX and TypeScript, compiled in the browser with esbuild (WebAssembly). npm packages can be imported by name and are loaded from [esm.sh](https://esm.sh). Tailwind classes work out of the box. | A runnable Vite project |

### Editor (powered by Monaco, the engine behind VS Code)

- Syntax highlighting with proper JSX/TSX/HTML colors for tags, components, attributes and strings.
- TypeScript IntelliSense across files: completions, hover info, errors as you type.
- **Go to Definition:** `Ctrl+click` or `F12` jumps to a component or function, even in another
  file. `Alt+F12` peeks it inline.
- **Auto-import:** pick `useState` (or anything exported from your own files) from the suggestions
  and the import is added or merged at the top.
- **Tailwind CSS IntelliSense:** class-name completions and color swatches inside `className="..."`.
- **Emmet** in HTML, JSX, TSX and CSS: type `ul>li*3` or `div.card>h2+p` and press Enter or Tab.
  A real tag name expands on Enter too — type `p` in markup to get `<p></p>`; `p.note` and
  `main#app` add class/id attributes (`className` in JSX/TSX). Ordinary words are left alone;
  custom elements (`my-card`) and capitalized JSX components work too.
- **Word-based suggestions** on top of the TypeScript, auto-import and Tailwind completions.
- **React snippets:** `rfc`, `rfce`, `rafce`, `rfcp`, `us` (useState), `ue`, `uec`, `ur`, `um`,
  `ucb`, `imr`, `imc`, `clg`, `jmap`, `jcond`, `jtern`, `hclick`.
- **Tags:** auto-close, self-closing tags and auto-rename of the matching tag (each can be turned
  off in Settings).
- **Attribute values:** choosing `className` inserts `className=""` and choosing `onClick` inserts
  `onClick={}`, with the cursor in the right place.
- **Unused code is dimmed**, like in VS Code (unused imports and variables).
- **Inlay type hints** in `.ts`/`.tsx` files (hidden in `.js`/`.jsx`, where they don't belong).
- **Formatting with Prettier** (`Shift+Alt+F`) for HTML, CSS, JS, TS, JSX and TSX, with Format On
  Save and **Format After Delay** (auto-formats when you stop typing) both on by default, plus
  settings for semicolons, quotes and line width.
- Multi-cursor, move/copy line, sticky scroll, bracket-pair colors, minimap, find and replace,
  go to line, go to symbol, and the error markers on the scrollbar.

### Workbench

- **Activity bar** with Explorer, Search and Outline.
- **Explorer:** a single VS Code-style file tree. Folders open and close, new files and folders are
  named inline (Enter creates, Esc cancels, `a/b.js` creates the folders on the way), files can be
  renamed, deleted and downloaded, and files with errors turn red with an error count.
  **Drag and drop** moves files and folders (imports are rewritten), and a **right-click menu**
  offers new file/folder, rename, delete, copy path, download and upload.
- **Search across files** (`Ctrl+Shift+F`) with match case, whole word, regex and replace-all with a preview.
- **Outline** (`Ctrl+Shift+U`) of components, hooks, functions, types or CSS selectors.
- **Breadcrumbs**, **tabs** with file-type icons and a highlighted active tab, and **Zen mode** (`Ctrl+K` then `Z`).
- **Command palette** (`Ctrl+Shift+P`) and **Quick Open** (`Ctrl+P`).
- **What's New:** the sparkles button in the header opens a release timeline, newest first.
- **Bottom panel** with four tabs, docked at the bottom, on the right, or maximized full-screen
  (layout buttons in the panel header, or the `View: Move Panel…` commands):
  - **Problems:** errors and warnings; click one to jump to it.
  - **Output:** what your page's JavaScript logs (`console.log`, warnings, errors).
  - **Debug Console:** evaluate expressions against the running preview.
  - **Terminal:** a browser-based shell for your project files. It supports `ls`, `cd`, `pwd`,
    `tree`, `cat`, `touch`, `mkdir`, `rm`, `mv`, `cp`, `echo` (with `>` and `>>`), `history`,
    `clear` and `node file.js`, which runs a script in a sandbox and imitates Node.
    (It is not a real Node install, so `npm install` is not available.)
- **Live preview** that updates as you type, can be refreshed with `Ctrl+Enter` and opened in a
  separate window. Console output is also mirrored to the browser's DevTools.
- **Font size controls** for the editor (`Ctrl+=`, `Ctrl+-`, `Ctrl+0`, Ctrl+mouse wheel, status bar)
  and separately for the bottom panel.
- **Hide/show header** (`Ctrl+K` then `H`).

### Themes and settings

14 color themes with live preview (`Ctrl+K` then `Ctrl+T`): Dark+, Light+, Playground Midnight,
One Dark Pro, Dracula, Monokai, GitHub Dark, GitHub Light, Night Owl, Tokyo Night, Catppuccin Mocha,
Shades of Purple, Solarized Light and High Contrast.

Settings (`Ctrl+,`) include font family and ligatures, font size, tab size, word wrap, minimap,
line numbers, cursor style, whitespace rendering, bracket pairs, sticky scroll, auto-closing tags,
self-closing tags, rename tags, Emmet, React snippets, inlay hints, JavaScript suggestion behavior,
formatting options, Format On Save, Format After Delay and Auto Save. The **Updates** section
checks for a newer version of the app and applies it with *Update now* (installed app or
production build).

### Files, saving and sharing

- **Auto Save** to your browser (on by default). With it off, `Ctrl+S` saves and unsaved tabs show a dot.
- **Upload** files or whole folders with the Explorer buttons, `Ctrl+O`, or drag and drop.
  A single folder opens like VS Code's *Open Folder*: its structure becomes the project, its name
  becomes the Explorer root, and the preview runs it (a `src/` layout works too). Loose files merge
  into the current project. `node_modules`, `.git` and `dist` are skipped.
- **Download** a single file, a folder, or the whole project (`Ctrl+Alt+S`) as a `.zip`.
- **Share links:** the share button copies a link with your whole project inside it, so there is
  no server and no account. Whoever opens it gets a copy of your project.
- **Templates:** React + TypeScript, React Todo App, HTML/CSS/JavaScript, and a Tailwind landing page.
- **Images:** PNG, JPG, GIF, WebP, AVIF, ICO and BMP files (up to 1.5 MB) open in a VS Code-style
  image viewer with zoom controls, and render in the preview when referenced from HTML or CSS.
- Many other file types (Markdown, JSON, SCSS, Vue, Svelte, Python, C/C++, C#, Java, Go, Rust, PHP
  and more) can be created and edited with highlighting. Only HTML, CSS, JS, TS, JSX and TSX run in the preview.

### Product site

- A homepage, **Docs** (`#/docs`) and step-by-step **Guides** (`#/guide`) built into the app.
- A 7-step **walkthrough** for first-time users. Replay it any time with *Help: Start Walkthrough*
  in the command palette.

### Install as a desktop app (PWA)

Open the app in Chrome or Edge and click **Install app** in the header (or the install icon in the
address bar). It opens in its own window, works offline after the first visit, and some browser
shortcuts (like `Ctrl+N` and `Ctrl+W`) are passed to the editor in the installed app.

## Keyboard shortcuts

On macOS use `Cmd` instead of `Ctrl`. Press `Ctrl+K` then `Ctrl+S` inside the app for the full list.

| Action | Shortcut |
| --- | --- |
| Quick Open / Command Palette | `Ctrl+P` / `Ctrl+Shift+P` |
| Keyboard Shortcuts | `Ctrl+K` `Ctrl+S` |
| Color Theme | `Ctrl+K` `Ctrl+T` |
| Settings | `Ctrl+,` |
| Save / Run preview | `Ctrl+S` / `Ctrl+Enter` |
| Switch workspace | `Ctrl+K` `W` |
| Hide / show header | `Ctrl+K` `H` |
| Zen mode | `Ctrl+K` `Z` |
| New file / New folder | `Alt+N` / `Alt+Shift+N` |
| Close tab | `Alt+W` |
| Upload files | `Ctrl+O` |
| Download project | `Ctrl+Alt+S` |
| Rename file (or symbol in editor) | `F2` |
| Explorer / Search / Outline | `Ctrl+Shift+E` / `Ctrl+Shift+F` / `Ctrl+Shift+U` |
| Toggle files / preview / panel | `Ctrl+B` / `Ctrl+\` / `Ctrl+J` |
| Toggle terminal | ``Ctrl+` `` |
| Font size bigger / smaller / reset | `Ctrl+=` / `Ctrl+-` / `Ctrl+0` |
| Format document | `Shift+Alt+F` |
| Find / Replace | `Ctrl+F` / `Ctrl+H` |
| Toggle comment | `Ctrl+/` |
| Go to line / Go to symbol | `Ctrl+G` / `Ctrl+Shift+O` |
| Go to definition / Peek | `F12` or `Ctrl+click` / `Alt+F12` |
| Add next occurrence | `Ctrl+D` |
| Move line / Copy line | `Alt+↑/↓` / `Shift+Alt+↑/↓` |
| Trigger suggestions | `Ctrl+Space` |
| Expand Emmet | `Enter` or `Tab` |

In a normal browser tab, `Ctrl+N` and `Ctrl+W` are reserved by the browser, which is why new file
and close tab use `Alt`. In the installed app the `Ctrl` versions work too.

## Getting started

### Requirements

- [Node.js](https://nodejs.org/) 20.19 or newer (required by Vite 7)
- npm (comes with Node)

### Run locally

```bash
git clone https://github.com/EJ-365/ReactPlagroundDev.git
cd ReactPlagroundDev
npm install
npm run dev
```

Open http://localhost:5173.

### Production build

```bash
npm run build     # type-checks with tsc, then builds to dist/
npm run preview   # serves dist/ at http://localhost:4173
```

Use `npm run preview` (or a deployed copy) to try the desktop install and offline support.
They rely on a service worker, which the dev server doesn't run.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check and build a production bundle in `dist/` |
| `npm run preview` | Serve the production build locally |

## Deploying

`dist/` is a static site, so any static host works. The app uses hash-based routes (`#/app`,
`#/docs`, `#/guide`), so no rewrite rules are needed.

**Vercel:** import the GitHub repo and use

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

**Cloudflare Pages:** connect the repo, choose the Vite preset (build command `npm run build`,
output directory `dist`).

**Netlify / GitHub Pages:** same build command and output directory.

Use HTTPS (all of the hosts above do), since installing the app and running it offline need it.
Share links use the address the app is served from, so links created on your deployment point to it.

## How it works

```
 ┌──────────────┐   edits    ┌────────────────────┐   bundle    ┌──────────────────────┐
 │ Monaco editor│ ─────────▶ │ esbuild-wasm        │ ──────────▶ │ sandboxed <iframe>   │
 │ (+ TS worker,│            │ compiles TSX/JSX/TS │             │ import map → esm.sh  │
 │  Tailwind,   │            │ resolves your files │             │ console → Output tab │
 │  Emmet)      │            └────────────────────┘             └──────────────────────┘
 └──────┬───────┘
        │ auto-save
        ▼
  localStorage (one project per workspace)
```

- **Editing:** Monaco runs the TypeScript language service in a web worker, which powers
  completions, errors, go-to-definition and auto-imports across all your files.
- **Compiling (React):** esbuild, compiled to WebAssembly, bundles your files in the browser.
  `react`, `react-dom` and other npm imports are mapped to [esm.sh](https://esm.sh), so an internet
  connection is needed the first time a package is loaded.
- **Compiling (HTML · CSS · JS):** `index.html` is served as-is, and its `<link>` and `<script>`
  tags are pointed at your project files.
- **Preview:** the result runs in a sandboxed iframe. Console calls are forwarded to the Output tab
  and the Debug Console evaluates expressions inside it.
- **Storage:** projects and settings live in `localStorage`. Share links compress the project into
  the URL hash, so they never touch a server.
- **Offline:** a service worker caches the app and the CDN files it has loaded.

## Project structure

```
ReactPlagroundDev/
├── index.html                # App shell and metadata
├── public/
│   ├── manifest.webmanifest  # PWA manifest (name, icons, shortcuts)
│   ├── sw.js                 # Service worker for offline support
│   ├── tailwind.worker.js    # Tailwind IntelliSense worker
│   ├── favicon.svg
│   └── icons/                # App, maskable and Apple touch icons
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Routes: homepage, docs, guide, editor
│   ├── defaults.ts           # Starter files
│   ├── components/           # Workbench UI
│   │   ├── Playground.tsx    #   Main editor layout and commands
│   │   ├── CodeEditor.tsx    #   Monaco wrapper
│   │   ├── Sidebar.tsx       #   Explorer tree
│   │   ├── SearchView.tsx    #   Search across files
│   │   ├── OutlineView.tsx   #   Outline
│   │   ├── TabBar.tsx, Breadcrumbs.tsx, StatusBar.tsx, TitleBar.tsx, ActivityBar.tsx
│   │   ├── PreviewPane.tsx   #   Live preview
│   │   ├── ConsolePanel.tsx  #   Problems, Output, Debug Console, Terminal
│   │   ├── SettingsPanel.tsx, ThemePicker.tsx, ShortcutsPanel.tsx, TemplatePicker.tsx
│   │   ├── Walkthrough.tsx   #   First-run tour
│   │   ├── FileIcon.tsx, Logo.tsx, Overlays.tsx
│   ├── lib/                  # Editor and runtime logic
│   │   ├── compile.ts        #   esbuild-wasm bundling
│   │   ├── preview.ts        #   Preview document and import map
│   │   ├── monacoSetup.ts    #   Monaco languages, workers, options
│   │   ├── intellisense.ts   #   Completions, auto-import, attribute values
│   │   ├── jsxSyntax.ts      #   JSX/HTML tag coloring
│   │   ├── tagRename.ts      #   Auto rename tag
│   │   ├── snippets.ts       #   React snippets
│   │   ├── tailwindService.ts#   Tailwind IntelliSense
│   │   ├── format.ts         #   Prettier formatting
│   │   ├── terminal.ts, nodeRunner.ts  # In-browser terminal and node runner
│   │   ├── themes.ts         #   Color themes
│   │   ├── settings.ts       #   Settings and defaults
│   │   ├── storage.ts, workspace.ts    # Saving and workspaces
│   │   ├── share.ts          #   Share links
│   │   ├── upload.ts, download.ts, zip.ts
│   │   ├── templates.ts      #   Project templates
│   │   └── install.ts        #   PWA install prompt
│   ├── hooks/                # useProject, useMediaQuery
│   └── site/                 # Homepage, Docs and Guides
│       ├── Landing.tsx, Docs.tsx, Guide.tsx, SiteLayout.tsx
├── tailwind.config.js
├── vite.config.ts
└── LICENSE
```

## Tech stack

| Area | Tools |
| --- | --- |
| UI | React 19, TypeScript 5.9, Tailwind CSS 3, lucide-react |
| Build | Vite 7 |
| Editor | Monaco Editor 0.53, monaco-tailwindcss, emmet-monaco-es |
| In-browser compiler | esbuild-wasm |
| Formatting | Prettier 3 |
| Packages in the preview | esm.sh |

## Browser support

Works best in recent Chrome, Edge and other Chromium browsers (needed for the desktop install).
Other modern browsers should run the editor and preview, but it has been tested mainly in Chrome; installing as an app depends on the browser.
On phones the editor works, and the activity bar is replaced by the command palette.

## Privacy

- No accounts, no analytics, no ads, no tracking.
- Projects are saved only in your browser's local storage. Clearing site data deletes them, so
  download anything you want to keep.
- A share link contains your project's code, so anyone with the link can read it.
- The homepage requests the public star count from the GitHub API.

## Limitations

- The terminal imitates a shell and Node inside the browser; it cannot run `npm install` or a real dev server.
- npm packages in the React workspace load from esm.sh, so they need an internet connection the first time.
- Only HTML, CSS, JS, TS, JSX and TSX run in the preview. Other languages can be edited but not executed.
- Browser storage has a size limit (usually around 5 MB per site), which is plenty for code but not for large assets.

## Contributing

Bug reports, ideas and pull requests are welcome.

1. Fork the repo and create a branch: `git checkout -b feature/my-change`
2. Install and run it: `npm install && npm run dev`
3. Make your change and check that `npm run build` passes (it runs the TypeScript checker)
4. Commit with a clear message and open a pull request describing what changed and why

Found a bug? [Open an issue](https://github.com/EJ-365/ReactPlagroundDev/issues) with steps to
reproduce it, what you expected, and your browser.

## Support the project

If Playground is useful to you, please **[star the repo](https://github.com/EJ-365/ReactPlagroundDev)**.
It helps other developers find it.

## Author

**Ejay Gabriel**, Frontend Developer

- GitHub: [@EJ-365](https://github.com/EJ-365)
- Email: [eebudonihian@gmail.com](mailto:eebudonihian@gmail.com)

## License

[MIT](LICENSE) © 2026 Ejay Gabriel. Free to use, modify and share.
