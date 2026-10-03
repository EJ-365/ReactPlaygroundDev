export type SymbolKind = 'component' | 'function' | 'hook' | 'variable' | 'type' | 'class' | 'selector' | 'element'

export type DocSymbol = {
  name: string
  kind: SymbolKind
  line: number
  column: number
  depth: number
}

const SCRIPT_PATTERNS: Array<[RegExp, (name: string) => SymbolKind]> = [
  [/^(\s*)(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/, (name) => kindOf(name, 'function')],
  [/^(\s*)(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>/, (name) => kindOf(name, 'function')],
  [/^(\s*)(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:memo|forwardRef|React\.memo|React\.forwardRef)\(/, () => 'component'],
  [/^(\s*)(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/, () => 'class'],
  [/^(\s*)(?:export\s+)?(?:declare\s+)?(?:type|interface|enum)\s+([A-Za-z_$][\w$]*)/, () => 'type'],
  [/^()(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=/, () => 'variable'],
]

function kindOf(name: string, fallback: SymbolKind): SymbolKind {
  if (/^use[A-Z0-9]/.test(name)) return 'hook'
  if (/^[A-Z]/.test(name)) return 'component'
  return fallback
}

function depthOf(indent: string) {
  return Math.floor(indent.replace(/\t/g, '  ').length / 2)
}

export function documentSymbols(path: string, source: string): DocSymbol[] {
  const lines = source.split(/\r?\n/)
  const symbols: DocSymbol[] = []
  if (/\.css$/.test(path)) {
    lines.forEach((text, index) => {
      const match = text.match(/^(\s*)([^{}@/][^{}]*?|@[\w-]+[^{}]*?)\s*\{/)
      if (match) symbols.push({ name: match[2].trim(), kind: 'selector', line: index + 1, column: match[1].length + 1, depth: depthOf(match[1]) })
    })
    return symbols
  }
  if (/\.html$/.test(path)) {
    lines.forEach((text, index) => {
      for (const match of text.matchAll(/<([a-z][\w-]*)\b[^>]*\bid=["']([^"']+)["']/gi)) {
        symbols.push({ name: `${match[1]}#${match[2]}`, kind: 'element', line: index + 1, column: (match.index ?? 0) + 1, depth: 0 })
      }
    })
    return symbols
  }
  let inComment = false
  lines.forEach((text, index) => {
    if (inComment) {
      if (text.includes('*/')) inComment = false
      return
    }
    if (/^\s*\/\*/.test(text) && !text.includes('*/')) {
      inComment = true
      return
    }
    for (const [pattern, kind] of SCRIPT_PATTERNS) {
      const match = text.match(pattern)
      if (!match) continue
      const name = match[2]
      if (symbols.some((symbol) => symbol.line === index + 1)) break
      symbols.push({ name, kind: kind(name), line: index + 1, column: match[1].length + 1, depth: depthOf(match[1]) })
      break
    }
  })
  return symbols
}

export function symbolAt(symbols: DocSymbol[], line: number) {
  let found: DocSymbol | null = null
  for (const symbol of symbols) {
    if (symbol.line > line) break
    if (symbol.depth === 0 || (found && symbol.depth > found.depth)) found = symbol
  }
  return found
}
