import { isValidFileName, isValidFolderName, normalizePath } from './files'
import type { RunHandle, Stream } from './nodeRunner'
import type { Problem } from '../types'
import type { WorkspaceId } from './workspace'

export type Tone = 'out' | 'err' | 'muted' | 'dir' | 'ok' | 'accent'
export type Part = { text: string; tone: Tone }

export type ShellContext = {
  root: string
  workspace: WorkspaceId
  files: () => Record<string, string>
  folders: () => string[]
  problems: () => Problem[]
  createFile: (path: string) => void
  writeFile: (path: string, content: string) => void
  createFolder: (path: string) => void
  deleteFile: (path: string) => void
  deleteFolder: (path: string) => void
  renameFile: (from: string, to: string) => void
  renameFolder: (from: string, to: string) => void
  open: (path: string) => void
  run: () => void
  close: () => void
}

export type ShellIO = {
  cwd: string
  setCwd: (cwd: string) => void
  print: (text: string, tone?: Tone) => void
  printParts: (parts: Part[]) => void
  clear: () => void
  history: string[]
  spawn: (start: () => Promise<RunHandle | null>) => Promise<number>
}

export const COMMANDS: Record<string, string> = {
  help: 'Show this list',
  ls: 'List files in a folder (ls -a, ls folder)',
  cd: 'Change folder (cd folder, cd .., cd ~)',
  pwd: 'Print the current folder',
  tree: 'Show the folder tree',
  cat: 'Print a file',
  touch: 'Create empty files',
  mkdir: 'Create folders (nested paths work, -p is optional)',
  rm: 'Delete files, or folders with -r',
  mv: 'Move or rename a file or folder',
  cp: 'Copy a file',
  echo: 'Print text, or write it with > file / >> file',
  code: 'Open a file in the editor',
  node: 'Run a JavaScript or TypeScript file (node script.js, node -e "code")',
  npm: 'npm start / npm run dev reloads the preview, npm run build checks for errors',
  history: 'Show previous commands',
  clear: 'Clear the terminal (Ctrl+L)',
  exit: 'Close the panel',
}

export function prompt(root: string, cwd: string) {
  return `~/${root}${cwd ? `/${cwd}` : ''}`
}

export function tokenize(line: string) {
  const tokens: string[] = []
  let current = ''
  let quote = ''
  let started = false
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = ''
      else current += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
      started = true
    } else if (/\s/.test(ch)) {
      if (started || current) tokens.push(current)
      current = ''
      started = false
    } else {
      current += ch
      started = true
    }
  }
  if (started || current) tokens.push(current)
  return tokens
}

function splitChain(line: string) {
  const parts: { text: string; op: '&&' | ';' }[] = []
  let quote = ''
  let start = 0
  let op: '&&' | ';' = ';'
  for (let index = 0; index < line.length; index += 1) {
    const ch = line[index]
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === ';' || (ch === '&' && line[index + 1] === '&')) {
      parts.push({ text: line.slice(start, index), op })
      op = ch === ';' ? ';' : '&&'
      if (ch === '&') index += 1
      start = index + 1
    }
  }
  parts.push({ text: line.slice(start), op })
  return parts.filter((part) => part.text.trim())
}

export function resolvePath(cwd: string, arg: string) {
  if (arg === '~' || arg === '/') return ''
  if (arg.startsWith('~/')) return normalizePath(arg.slice(2))
  if (arg.startsWith('/')) return normalizePath(arg.slice(1))
  return normalizePath(`${cwd}/${arg}`)
}

function isDir(ctx: ShellContext, path: string) {
  if (!path) return true
  if (ctx.folders().includes(path)) return true
  return Object.keys(ctx.files()).some((file) => file.startsWith(`${path}/`))
}

function children(ctx: ShellContext, dir: string) {
  const prefix = dir ? `${dir}/` : ''
  const folders = new Set<string>()
  const files: string[] = []
  for (const path of [...ctx.folders(), ...Object.keys(ctx.files()).map((file) => file.split('/').slice(0, -1).join('/')).filter(Boolean)]) {
    if (!path.startsWith(prefix)) continue
    const name = path.slice(prefix.length).split('/')[0]
    if (name) folders.add(name)
  }
  for (const file of Object.keys(ctx.files())) {
    if (!file.startsWith(prefix)) continue
    const rest = file.slice(prefix.length)
    if (!rest.includes('/')) files.push(rest)
  }
  return { folders: [...folders].sort(), files: files.sort() }
}

export function complete(ctx: ShellContext, cwd: string, line: string) {
  const tokens = tokenize(line)
  const last = /\s$/.test(line) ? '' : tokens.pop() ?? ''
  if (!tokens.length && !/\s$/.test(line)) {
    const names = Object.keys(COMMANDS).filter((name) => name.startsWith(last))
    return names.length === 1 ? { line: `${names[0]} `, options: [] } : { line, options: names }
  }
  const slash = last.lastIndexOf('/')
  const dirPart = slash >= 0 ? last.slice(0, slash + 1) : ''
  const stem = last.slice(slash + 1)
  const dir = resolvePath(cwd, dirPart || '.')
  if (!isDir(ctx, dir)) return { line, options: [] }
  const { folders, files } = children(ctx, dir)
  const options = [...folders.map((name) => `${name}/`), ...files].filter((name) => name.startsWith(stem))
  if (options.length === 1) return { line: line.slice(0, line.length - last.length) + dirPart + options[0] + (options[0].endsWith('/') ? '' : ' '), options: [] }
  let common = stem
  if (options.length > 1) {
    const first = options[0]
    let length = stem.length
    while (length < first.length && options.every((option) => option[length] === first[length])) length += 1
    common = first.slice(0, length)
  }
  return { line: line.slice(0, line.length - last.length) + dirPart + common, options }
}

async function runOne(ctx: ShellContext, io: ShellIO, text: string): Promise<number> {
  const raw = text.trim()
  const redirect = /^(echo\b.*?)\s(>>?)\s*(\S+)\s*$/.exec(raw)
  const args = tokenize(redirect ? redirect[1] : raw)
  const name = args.shift() ?? ''
  const flags = args.filter((arg) => /^-\w+$/.test(arg)).join('')
  const operands = args.filter((arg) => !/^-\w+$/.test(arg))
  const fail = (message: string) => {
    io.print(message, 'err')
    return 1
  }
  const at = (arg: string) => resolvePath(io.cwd, arg)
  const files = ctx.files()

  switch (name) {
    case 'help': {
      io.print('Commands:', 'accent')
      for (const [command, detail] of Object.entries(COMMANDS)) io.printParts([{ text: `  ${command.padEnd(9)}`, tone: 'ok' }, { text: detail, tone: 'muted' }])
      io.print('Use Tab to complete names, ↑/↓ for history, Ctrl+C to stop a running script.', 'muted')
      return 0
    }
    case 'clear':
    case 'cls':
      io.clear()
      return 0
    case 'pwd':
      io.print(prompt(ctx.root, io.cwd))
      return 0
    case 'cd': {
      const target = at(operands[0] ?? '~')
      if (files[target] != null) return fail(`cd: not a directory: ${operands[0]}`)
      if (!isDir(ctx, target)) return fail(`cd: no such file or directory: ${operands[0]}`)
      io.setCwd(target)
      return 0
    }
    case 'ls':
    case 'dir': {
      const target = at(operands[0] ?? '.')
      if (files[target] != null) {
        io.print(target.split('/').pop() ?? target)
        return 0
      }
      if (!isDir(ctx, target)) return fail(`ls: cannot access '${operands[0]}': No such file or directory`)
      const { folders, files: names } = children(ctx, target)
      const entries: Part[] = [...folders.map((folder) => ({ text: `${folder}/`, tone: 'dir' as const })), ...names.map((file) => ({ text: file, tone: 'out' as const }))]
      if (flags.includes('a')) entries.unshift({ text: './', tone: 'dir' }, { text: '../', tone: 'dir' })
      if (!entries.length) return 0
      io.printParts(entries.flatMap((entry, index) => (index ? [{ text: '  ', tone: 'out' as const }, entry] : [entry])))
      return 0
    }
    case 'tree': {
      const target = at(operands[0] ?? '.')
      if (!isDir(ctx, target)) return fail(`tree: ${operands[0]}: not a directory`)
      io.print(target ? target.split('/').pop() ?? target : ctx.root, 'dir')
      let count = { dirs: 0, files: 0 }
      const walk = (dir: string, lead: string) => {
        const { folders, files: names } = children(ctx, dir)
        const all = [...folders.map((folder) => ({ folder: true, name: folder })), ...names.map((file) => ({ folder: false, name: file }))]
        all.forEach((entry, index) => {
          const lastOne = index === all.length - 1
          io.printParts([{ text: `${lead}${lastOne ? '└── ' : '├── '}`, tone: 'muted' }, { text: entry.name, tone: entry.folder ? 'dir' : 'out' }])
          if (entry.folder) {
            count = { ...count, dirs: count.dirs + 1 }
            walk(dir ? `${dir}/${entry.name}` : entry.name, `${lead}${lastOne ? '    ' : '│   '}`)
          } else count = { ...count, files: count.files + 1 }
        })
      }
      walk(target, '')
      io.print(`\n${count.dirs} director${count.dirs === 1 ? 'y' : 'ies'}, ${count.files} file${count.files === 1 ? '' : 's'}`, 'muted')
      return 0
    }
    case 'cat': {
      if (!operands.length) return fail('cat: missing file operand')
      let code = 0
      for (const arg of operands) {
        const path = at(arg)
        if (files[path] != null) io.print(files[path].replace(/\n$/, ''))
        else code = fail(isDir(ctx, path) ? `cat: ${arg}: Is a directory` : `cat: ${arg}: No such file or directory`)
      }
      return code
    }
    case 'touch': {
      if (!operands.length) return fail('touch: missing file operand')
      let code = 0
      for (const arg of operands) {
        const path = at(arg)
        if (files[path] != null) continue
        if (isDir(ctx, path)) continue
        if (!/\.[^./]+$/.test(path) || !isValidFileName(path)) code = fail(`touch: ${arg}: use a supported file name with an extension, like app.js`)
        else ctx.createFile(path)
      }
      return code
    }
    case 'mkdir': {
      if (!operands.length) return fail('mkdir: missing operand')
      let code = 0
      for (const arg of operands) {
        const path = at(arg)
        if (files[path] != null) code = fail(`mkdir: cannot create directory '${arg}': File exists`)
        else if (isDir(ctx, path)) {
          if (!flags.includes('p')) code = fail(`mkdir: cannot create directory '${arg}': File exists`)
        } else if (!isValidFolderName(path)) code = fail(`mkdir: ${arg}: use letters, numbers, dots, dashes, and underscores`)
        else ctx.createFolder(path)
      }
      return code
    }
    case 'rm':
    case 'rmdir': {
      if (!operands.length) return fail(`${name}: missing operand`)
      let code = 0
      for (const arg of operands) {
        const path = at(arg)
        if (!path) code = fail(`${name}: refusing to remove the project root`)
        else if (files[path] != null) ctx.deleteFile(path)
        else if (isDir(ctx, path)) {
          const empty = !Object.keys(files).some((file) => file.startsWith(`${path}/`))
          if (name === 'rm' && !flags.includes('r') && !flags.includes('R')) code = fail(`rm: cannot remove '${arg}': Is a directory (use rm -r)`)
          else if (name === 'rmdir' && !empty) code = fail(`rmdir: failed to remove '${arg}': Directory not empty`)
          else ctx.deleteFolder(path)
        } else if (!flags.includes('f')) code = fail(`${name}: cannot remove '${arg}': No such file or directory`)
      }
      return code
    }
    case 'mv':
    case 'cp': {
      if (operands.length !== 2) return fail(`${name}: usage: ${name} <source> <destination>`)
      const from = at(operands[0])
      let to = at(operands[1])
      const fileSource = files[from] != null
      if (!fileSource && !(name === 'mv' && from && isDir(ctx, from))) return fail(`${name}: cannot stat '${operands[0]}': No such file or directory`)
      if (isDir(ctx, to) && files[to] == null) to = to ? `${to}/${from.split('/').pop()}` : from.split('/').pop() ?? from
      if (to === from) return 0
      if (files[to] != null || (!fileSource && isDir(ctx, to))) return fail(`${name}: '${operands[1]}' already exists`)
      if (fileSource && !isValidFileName(to)) return fail(`${name}: ${operands[1]}: unsupported file name`)
      if (!fileSource && !isValidFolderName(to)) return fail(`${name}: ${operands[1]}: invalid folder name`)
      if (name === 'cp') {
        ctx.createFile(to)
        ctx.writeFile(to, files[from])
      } else if (fileSource) ctx.renameFile(from, to)
      else ctx.renameFolder(from, to)
      return 0
    }
    case 'echo': {
      const output = args.join(' ')
      if (!redirect) {
        io.print(output)
        return 0
      }
      const path = at(redirect[3])
      if (isDir(ctx, path) && files[path] == null) return fail(`echo: ${redirect[3]}: Is a directory`)
      if (files[path] == null) {
        if (!/\.[^./]+$/.test(path) || !isValidFileName(path)) return fail(`echo: ${redirect[3]}: use a supported file name with an extension`)
        ctx.createFile(path)
      }
      const before = redirect[2] === '>>' ? files[path] ?? '' : ''
      ctx.writeFile(path, `${before}${before && !before.endsWith('\n') ? '\n' : ''}${output}\n`)
      return 0
    }
    case 'code':
    case 'open': {
      if (!operands.length || operands[0] === '.') {
        io.print('The project is already open in the editor.', 'muted')
        return 0
      }
      const path = at(operands[0])
      if (files[path] == null) return fail(`${name}: ${operands[0]}: No such file`)
      ctx.open(path)
      return 0
    }
    case 'history':
      io.history.forEach((item, index) => io.printParts([{ text: `${String(index + 1).padStart(4)}  `, tone: 'muted' }, { text: item, tone: 'out' }]))
      return 0
    case 'exit':
      ctx.close()
      return 0
    case 'node':
      return runNode(ctx, io, args)
    case 'npm':
    case 'pnpm':
    case 'yarn':
      return runNpm(ctx, io, name, operands)
    case 'npx':
    case 'vite':
      return runNpm(ctx, io, 'npm', ['run', 'dev'])
    default:
      return fail(`${name}: command not found. Type help to see what you can run.`)
  }
}

async function runNode(ctx: ShellContext, io: ShellIO, args: string[]) {
  if (args[0] === '-v' || args[0] === '--version') {
    io.print('v22.0.0 (runs in your browser)')
    return 0
  }
  let entry: string
  let files = ctx.files()
  if (args[0] === '-e' || args[0] === '--eval' || args[0] === '-p' || args[0] === '--print') {
    if (args[1] == null) {
      io.print(`node: ${args[0]} requires an argument`, 'err')
      return 9
    }
    entry = '__eval.js'
    const printValue = args[0] === '-p' || args[0] === '--print'
    files = { ...files, [entry]: printValue ? `console.log(${args[1]})` : args[1] }
  } else if (!args[0]) {
    io.print('The interactive Node REPL is not available here. Use the Debug Console tab to evaluate expressions in the page, or run a file: node script.js', 'muted')
    return 0
  } else {
    entry = resolvePath(io.cwd, args[0])
    if (files[entry] == null) {
      const guess = ['.js', '.ts', '.mjs', '.jsx', '.tsx'].map((ext) => entry + ext).find((path) => files[path] != null)
      if (!guess) {
        io.print(`node: cannot find module '${args[0]}'`, 'err')
        return 1
      }
      entry = guess
    }
    if (!/\.(m?js|cjs|jsx|ts|tsx)$/.test(entry)) {
      io.print(`node: ${args[0]} is not a JavaScript or TypeScript file`, 'err')
      return 1
    }
  }
  return io.spawn(async () => {
    const [{ bundleScript }, { runScript }] = await Promise.all([import('./compile'), import('./nodeRunner')])
    const result = await bundleScript(entry, files)
    if (result.errors.length) {
      for (const error of result.errors) io.print(error, 'err')
      return null
    }
    return runScript(
      result.js,
      (stream: Stream, text: string) => io.print(text, stream === 'err' ? 'err' : 'out'),
      io.clear,
    )
  })
}

async function runNpm(ctx: ShellContext, io: ShellIO, tool: string, args: string[]) {
  const [command, script] = args
  if (command === '-v' || command === '--version') {
    io.print('10.0.0 (playground)')
    return 0
  }
  if (command === 'start' || (command === 'run' && (script === 'dev' || script === 'start' || script === 'preview'))) {
    ctx.run()
    io.printParts([{ text: '  ➜  ', tone: 'ok' }, { text: 'Preview reloaded. ', tone: 'out' }, { text: 'It updates as you type; logs appear in Output.', tone: 'muted' }])
    return 0
  }
  if (command === 'run' && script === 'build') {
    ctx.run()
    const problems = ctx.problems()
    const errors = problems.filter((problem) => problem.severity === 'error')
    for (const problem of problems) {
      io.printParts([
        { text: problem.severity === 'error' ? '✘ ' : '▲ ', tone: problem.severity === 'error' ? 'err' : 'accent' },
        { text: `${problem.file ? `${problem.file}${problem.line ? `:${problem.line}` : ''}  ` : ''}`, tone: 'muted' },
        { text: problem.message, tone: 'out' },
      ])
    }
    if (errors.length) {
      io.print(`Build failed with ${errors.length} error${errors.length === 1 ? '' : 's'}.`, 'err')
      return 1
    }
    io.print(`✓ Built with ${problems.length ? `${problems.length} warning${problems.length === 1 ? '' : 's'}` : 'no problems'}. Use Download (Ctrl+Alt+S) to export the project.`, 'ok')
    return 0
  }
  if (command === 'install' || command === 'i' || command === 'add') {
    if (ctx.workspace === 'react') io.print('Nothing to install: packages you import (import confetti from "canvas-confetti") load automatically from esm.sh.', 'muted')
    else io.print('Nothing to install: add a <script> or <link> from a CDN in index.html, or use import from "https://esm.sh/<package>" in a module script.', 'muted')
    return 0
  }
  if (command === 'run' && !script) {
    io.print('Scripts available:', 'accent')
    io.print('  dev      reload the preview')
    io.print('  build    check the project for errors')
    return 0
  }
  io.print(`${tool}: "${args.join(' ')}" is not available here. Try npm run dev, npm run build, or npm install.`, 'err')
  return 1
}

export async function execute(ctx: ShellContext, io: ShellIO, line: string) {
  let code = 0
  for (const part of splitChain(line)) {
    if (part.op === '&&' && code !== 0) break
    code = await runOne(ctx, io, part.text)
  }
  return code
}
