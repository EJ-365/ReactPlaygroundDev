export type ChangeEntry = {
  version: string
  date: string
  title: string
  items: string[]
}

export const APP_VERSION = '1.2.0'

export const CHANGELOG: ChangeEntry[] = [
  {
    version: '1.2.0',
    date: '2026-10-04',
    title: 'TypeScript workspace, dimmed dead code, more languages',
    items: [
      'New TypeScript workspace: a standalone main.ts tab with full type-checking — bundled and run in the preview, or via node main.ts in the Terminal. Pick it in the header or let Ctrl+K W cycle through all workspaces',
      'Language workspaces in the header — Python runs locally via Pyodide (real CPython in WASM, print() lands in Output), and C++, Java, C#, Go, and Rust compile and run on the Wandbox cloud runner when you press Run; all six ship keyword/snippet IntelliSense and starter templates',
      'Script and language workspaces get a terminal-style output window as their preview, and the Debug Console is a live REPL — real Python state via Pyodide, expression eval for the compiled languages via Wandbox',
      'Unused variables, imports, parameters, and unreachable code are dimmed in JavaScript files too, matching VS Code (they were already dimmed in TypeScript)',
      'Downloading an HTML · CSS · JS project transpiles any linked .ts/.tsx files to .js and rewrites the <script> tags, so the exported folder opens straight in a browser',
      'Editor tabs with syntax highlighting and file icons for 70+ file types: Objective-C, Kotlin, Swift, Dart, Lua, R, Perl, Elixir, Julia, Scala, Clojure, F#, VB, PowerShell, Batch, Dockerfile, Terraform/HCL, Protobuf, Solidity, Pascal, Scheme, Tcl, Razor, CoffeeScript, Pug, Handlebars, Twig, Liquid, Assembly, WGSL, INI/TOML/.env, and more',
      'New templates: TypeScript Playground plus Python, C++, Java, C#, Go, and Rust starters',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-03',
    title: 'VS Code parity update',
    items: [
      'Open Folder: upload or drop a single folder and it becomes the project — the Explorer root takes its name and the preview runs it right away (src/ layouts work too)',
      'Drag and drop files and folders inside the Explorer to move them; imports are rewritten automatically',
      'Right-click menus in the Explorer and the editor with new, rename, delete, copy path, download, and more',
      'Type a tag name like p and press Enter to get <p></p> — works with classes and ids too (p.note, main#app)',
      'Word-based suggestions on top of the JavaScript and Tailwind class completions',
      'Panel layouts: dock the console at the bottom, on the right, or full screen',
      'Rebuilt settings toggles and a What\u2019s New log in the header',
      'Updates: Settings → Updates checks for a newer version and applies it with Update now',
      'Format After Delay auto-formats the open file about a second after you stop typing, and Format On Save is on by default',
      'Images: PNG, JPG, GIF, WebP, AVIF, ICO and BMP files open in a VS Code-style viewer with zoom, and render in the preview when referenced from HTML or CSS',
      'Tag expansion on Enter now only fires for real element names — words like hi no longer become tags',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-09-14',
    title: 'Initial release',
    items: [
      'Two workspaces: HTML · CSS · JS and React + TypeScript, each with its own files and preview',
      'Monaco editor with IntelliSense, auto-imports, Tailwind completions, Emmet, and React snippets',
      'Live preview with device sizes, pop-out window, and problems reporting',
      'Bottom panel with Problems, Output, Debug Console, and a project Terminal',
      'Themes, keyboard shortcuts, command palette, search, and Zen mode',
      'Installable as an offline PWA',
    ],
  },
]
