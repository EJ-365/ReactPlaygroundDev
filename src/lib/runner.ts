import type { WorkspaceInfo } from './workspace'

export type RunLine = { level: 'log' | 'info' | 'warn' | 'error' | 'system'; text: string }

// ── Python (Pyodide, runs locally and stays loaded → shared by the runner and the REPL) ──

const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'

type PyodideLike = {
  version: string
  FS: { mkdirTree(dir: string): void; writeFile(path: string, content: string): void }
  globals: { set(name: string, value: unknown): void }
  setStdout(options: { batched(line: string): void }): void
  setStderr(options: { batched(line: string): void }): void
  runPythonAsync(code: string): Promise<unknown>
}

let pyodidePromise: Promise<PyodideLike> | null = null

export function getPyodide(): Promise<PyodideLike> {
  pyodidePromise ??= (async () => {
    const scope = globalThis as { loadPyodide?: (options: { indexURL: string }) => Promise<PyodideLike> }
    if (!scope.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const el = document.createElement('script')
        el.src = `${PYODIDE_BASE}pyodide.js`
        el.onload = () => resolve()
        el.onerror = () => reject(new Error('Could not download the Python runtime (jsdelivr CDN).'))
        document.head.appendChild(el)
      })
    }
    return scope.loadPyodide!({ indexURL: PYODIDE_BASE })
  })()
  return pyodidePromise
}

let pythonTail: Promise<unknown> = Promise.resolve()
let pythonBusy = false

/** True while a Python run/eval is executing — REPL input queues behind it. */
export function isPythonBusy() {
  return pythonBusy
}

/** Runs the Python project locally — serialized so rapid saves never overlap. */
export function runPython(files: Record<string, string>, entry: string): Promise<{ lines: RunLine[]; version: string }> {
  const run = pythonTail.then(() => runPythonNow(files, entry))
  pythonTail = run.catch(() => undefined)
  return run
}

async function runPythonNow(files: Record<string, string>, entry: string) {
  const py = await getPyodide()
  pythonBusy = true
  const lines: RunLine[] = []
  py.setStdout({ batched: (line) => lines.push({ level: 'log', text: line }) })
  py.setStderr({ batched: (line) => lines.push({ level: 'error', text: line }) })
  for (const [path, text] of Object.entries(files)) {
    if (!/\.py$/i.test(path)) continue
    const dir = path.split('/').slice(0, -1).join('/')
    if (dir) py.FS.mkdirTree(dir)
    py.FS.writeFile(path, text)
  }
  const source = files[entry] ?? files[Object.keys(files).find((name) => /\.py$/i.test(name)) ?? ''] ?? ''
  try {
    await py.runPythonAsync(source)
  } catch (error) {
    lines.push({ level: 'error', text: String(error instanceof Error ? error.message : error) })
  } finally {
    pythonBusy = false
  }
  return { lines, version: py.version }
}

/** Evaluates an expression/statement in the persistent Python session — a real REPL. Serialized with project runs. */
export function evalPython(code: string): Promise<{ ok: boolean; text: string }> {
  const run = pythonTail.then(() => evalPythonNow(code))
  pythonTail = run.catch(() => undefined)
  return run
}

async function evalPythonNow(code: string) {
  const py = await getPyodide()
  pythonBusy = true
  const printed: string[] = []
  py.setStdout({ batched: (line) => printed.push(line) })
  try {
    const value = await py.runPythonAsync(code)
    let text = printed.join('\n')
    if (value !== undefined) {
      py.globals.set('__pg_val', value)
      text += (text ? '\n' : '') + ((await py.runPythonAsync('repr(__pg_val)')) as string)
    }
    return { ok: true, text: text || '(no output)' }
  } catch (error) {
    return { ok: false, text: String(error instanceof Error ? error.message : error) }
  } finally {
    pythonBusy = false
  }
}

// ── Compiled languages (Wandbox remote runner) ──

export type RemoteResult = {
  stdout: string
  stderr: string
  code: number | null
  compileError: string
  compiler: string
}

const ENDPOINT = 'https://wandbox.org/api/compile.json'

/** Compiles and runs a project on the free Wandbox service and returns the captured output. */
export async function executeRemote(files: Record<string, string>, info: WorkspaceInfo): Promise<RemoteResult> {
  if (!info.runner) throw new Error('This workspace has no code runner')
  const entryName = info.entry in files ? info.entry : Object.keys(files).sort()[0]
  if (!entryName) throw new Error(`No ${info.entry} file to run`)
  let code = files[entryName]
  // Wandbox compiles the main file as prog.java — a `public` class must match the file name, so drop the modifier.
  if (info.runner.startsWith('openjdk')) code = code.replace(/\bpublic\s+(?=class\b)/g, '')
  const codes = Object.entries(files)
    .filter(([name]) => name !== entryName)
    .map(([name, content]) => ({ file: name.split('/').pop() ?? name, code: content }))
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, codes, compiler: info.runner, options: '', 'compiler-option-raw': '', 'runtime-option-raw': '', save: false }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(`Code runner returned HTTP ${response.status}`)
  const data = (await response.json()) as {
    status?: string
    compiler_error?: string
    compiler_message?: string
    program_output?: string
    program_error?: string
    program_message?: string
  }
  return {
    stdout: data.program_output || data.program_message || '',
    stderr: data.program_error || '',
    code: data.status === undefined || data.status === '' ? null : Number(data.status),
    compileError: data.compiler_error || data.compiler_message || '',
    compiler: info.runner,
  }
}

const isStatement = (input: string) => /[;}]$/.test(input.trim()) || input.trim().includes('\n')

/** Wraps a REPL input into a runnable program per compiler — expressions get printed, statements run as-is. */
export function wrapEval(runner: string, input: string): string | null {
  const wraps: Record<string, string> = {
    'gcc-13.2.0': `#include <iostream>\nint main() {\n    ${isStatement(input) ? input : `std::cout << (${input}) << "\\n";`}\n    return 0;\n}`,
    'openjdk-jdk-22+36': `class Main {\n    public static void main(String[] args) {\n        ${isStatement(input) ? input : `System.out.println(${input});`}\n    }\n}`,
    'mono-6.12.0.199': `using System;\nclass P {\n    static void Main() {\n        ${isStatement(input) ? input : `Console.WriteLine(${input});`}\n    }\n}`,
    'go-1.23.2': `package main\n\nimport "fmt"\n\nfunc main() {\n    ${isStatement(input) ? input : `fmt.Println(${input})`}\n}`,
    'rust-1.82.0': `fn main() {\n    ${isStatement(input) ? input : `println!("{:?}", ${input});`}\n}`,
  }
  return wraps[runner] ?? null
}
