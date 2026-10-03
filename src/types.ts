export type Ser =
  | { t: 'null' }
  | { t: 'undefined' }
  | { t: 'max' }
  | { t: 'circular' }
  | { t: 'string'; v: string }
  | { t: 'number'; v: string }
  | { t: 'boolean'; v: boolean }
  | { t: 'bigint'; v: string }
  | { t: 'symbol'; v: string }
  | { t: 'function'; v: string }
  | { t: 'element'; v: string }
  | { t: 'error'; name: string; message: string; stack: string }
  | { t: 'array'; length: number; v: Ser[] }
  | { t: 'object'; name: string; v: { k: string; v: Ser }[] }

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'result' | 'input' | 'system'

export type ConsoleEntry = {
  id: number
  level: ConsoleLevel
  args: Ser[]
  time: number
  count: number
  key: string
  source: 'page' | 'repl'
}

export type Problem = {
  id: string
  severity: 'error' | 'warning'
  message: string
  file?: string
  line?: number
  column?: number
  source: string
}

export type FileProblems = { errors: number; warnings: number }

export type Device = 'desktop' | 'tablet' | 'phone'
export type MobilePane = 'code' | 'preview' | 'console'
export type ConsoleTab = 'problems' | 'output' | 'debug' | 'terminal'

export type EditorHandle = {
  setAll: (files: Record<string, string>, active: string) => void
  reveal: (path: string, line: number, column: number) => void
  replace: (path: string, value: string) => void
  format: () => Promise<void>
  focus: () => void
  relayout: () => void
}
