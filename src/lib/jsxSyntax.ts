export type SyntaxKind = 'jsx-bracket' | 'jsx-tag' | 'jsx-component' | 'jsx-attr' | 'jsx-text' | 'js-fn' | 'js-control'

export type SyntaxSpan = { start: number; end: number; kind: SyntaxKind }

const CONTROL = new Set([
  'import', 'export', 'from', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
  'try', 'catch', 'finally', 'throw', 'await', 'default', 'yield', 'as',
])

const NOT_CALLS = new Set([...CONTROL, 'function', 'typeof', 'new', 'in', 'of', 'instanceof', 'void', 'delete', 'super', 'this'])

const JSX_PREFIX_WORDS = new Set(['return', 'yield', 'default', 'case', 'else', 'do', 'in', 'of', 'await', '?', ':'])

const isIdStart = (ch: string) => /[A-Za-z_$]/.test(ch)
const isId = (ch: string) => /[\w$]/.test(ch)
const isTagChar = (ch: string) => /[\w$.:-]/.test(ch)
const isSpace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'

function prevSignificant(text: string, from: number) {
  let j = from - 1
  while (j >= 0 && isSpace(text[j])) j -= 1
  if (j < 0) return ''
  if (isId(text[j])) {
    let k = j
    while (k > 0 && isId(text[k - 1])) k -= 1
    return text.slice(k, j + 1)
  }
  return text[j]
}

export function isJsxTagStart(text: string, at: number) {
  const next = text[at + 1]
  if (!(next === '>' || (next && isIdStart(next)))) return false
  const prev = prevSignificant(text, at)
  if (prev === '') return true
  if (prev.length === 1 && '(,=[{}!&|;>?:'.includes(prev)) return true
  return JSX_PREFIX_WORDS.has(prev)
}

export function scanSyntax(text: string, jsx: boolean): SyntaxSpan[] {
  const spans: SyntaxSpan[] = []
  const n = text.length
  let i = 0
  let budget = 400_000

  const push = (start: number, end: number, kind: SyntaxKind) => {
    if (end > start) spans.push({ start, end, kind })
  }

  const skipString = (quote: string) => {
    i += 1
    while (i < n && text[i] !== quote) {
      if (text[i] === '\\') i += 1
      else if (text[i] === '\n' && quote !== '`') break
      i += 1
    }
    i += 1
  }

  const skipTemplate = () => {
    i += 1
    while (i < n && text[i] !== '`') {
      if (text[i] === '\\') {
        i += 2
        continue
      }
      if (text[i] === '$' && text[i + 1] === '{') {
        i += 2
        parseJs(true)
        i += 1
        continue
      }
      i += 1
    }
    i += 1
  }

  const looksLikeJsx = (at: number) => isJsxTagStart(text, at)

  function parseJs(untilBrace: boolean) {
    let depth = 0
    while (i < n && budget-- > 0) {
      const ch = text[i]
      if (ch === '/' && text[i + 1] === '/') {
        const end = text.indexOf('\n', i)
        i = end === -1 ? n : end
        continue
      }
      if (ch === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2)
        i = end === -1 ? n : end + 2
        continue
      }
      if (ch === '"' || ch === "'") {
        skipString(ch)
        continue
      }
      if (ch === '`') {
        skipTemplate()
        continue
      }
      if (ch === '{') {
        depth += 1
        i += 1
        continue
      }
      if (ch === '}') {
        if (depth === 0 && untilBrace) return
        depth -= 1
        i += 1
        continue
      }
      if (jsx && ch === '<' && looksLikeJsx(i)) {
        parseElement()
        continue
      }
      if (isIdStart(ch) && (i === 0 || !isId(text[i - 1]))) {
        const start = i
        while (i < n && isId(text[i])) i += 1
        const word = text.slice(start, i)
        const before = start > 0 ? text[start - 1] : ''
        if (CONTROL.has(word) && before !== '.') {
          push(start, i, 'js-control')
          continue
        }
        let j = i
        while (j < n && (text[j] === ' ' || text[j] === '\t')) j += 1
        if (text[j] === '(' && !NOT_CALLS.has(word)) push(start, i, 'js-fn')
        else if (text[j] === '<' && /^[a-z]/.test(word) && /^use[A-Z]/.test(word)) push(start, i, 'js-fn')
        continue
      }
      i += 1
    }
  }

  function skipJsxSpace() {
    while (i < n && isSpace(text[i])) i += 1
  }

  function parseExpressionContainer() {
    i += 1
    parseJs(true)
    if (text[i] === '}') i += 1
  }

  function readTagName() {
    const start = i
    while (i < n && isTagChar(text[i])) i += 1
    const name = text.slice(start, i)
    if (name) push(start, i, /^[A-Z]/.test(name) || name.includes('.') ? 'jsx-component' : 'jsx-tag')
    return name
  }

  function parseElement() {
    push(i, i + 1, 'jsx-bracket')
    i += 1
    if (text[i] === '>') {
      push(i, i + 1, 'jsx-bracket')
      i += 1
      parseChildren()
      return
    }
    readTagName()
    while (i < n && budget-- > 0) {
      skipJsxSpace()
      const ch = text[i]
      if (ch === '/' && text[i + 1] === '>') {
        push(i, i + 2, 'jsx-bracket')
        i += 2
        return
      }
      if (ch === '>') {
        push(i, i + 1, 'jsx-bracket')
        i += 1
        parseChildren()
        return
      }
      if (ch === '{') {
        parseExpressionContainer()
        continue
      }
      if (ch && isIdStart(ch)) {
        const start = i
        while (i < n && /[\w$:-]/.test(text[i])) i += 1
        push(start, i, 'jsx-attr')
        skipJsxSpace()
        if (text[i] === '=') {
          i += 1
          skipJsxSpace()
          if (text[i] === '"' || text[i] === "'") skipString(text[i])
          else if (text[i] === '{') parseExpressionContainer()
          else if (text[i] === '<') parseElement()
        }
        continue
      }
      return
    }
  }

  function parseChildren() {
    let textStart = i
    const flush = (end: number) => {
      if (end > textStart && text.slice(textStart, end).trim()) push(textStart, end, 'jsx-text')
    }
    while (i < n && budget-- > 0) {
      const ch = text[i]
      if (ch === '{') {
        flush(i)
        parseExpressionContainer()
        textStart = i
        continue
      }
      if (ch === '<') {
        flush(i)
        if (text[i + 1] === '/') {
          push(i, i + 2, 'jsx-bracket')
          i += 2
          readTagName()
          skipJsxSpace()
          if (text[i] === '>') {
            push(i, i + 1, 'jsx-bracket')
            i += 1
          }
          return
        }
        parseElement()
        textStart = i
        continue
      }
      i += 1
    }
    flush(i)
  }

  parseJs(false)
  return spans
}

export const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

export type OpenTag = { name: string; start: number }

export function openTagBefore(text: string, cursor: number): OpenTag | null {
  const from = Math.max(0, cursor - 4000)
  for (let at = cursor - 1; at >= from; at -= 1) {
    if (text[at] !== '<') continue
    const match = /^<([A-Za-z][\w$.:-]*)/.exec(text.slice(at, at + 200))
    if (!match) continue
    let quote = ''
    let depth = 0
    let closed = false
    for (let j = at + match[0].length; j < cursor; j += 1) {
      const ch = text[j]
      if (quote) {
        if (ch === quote) quote = ''
        continue
      }
      if (ch === '"' || ch === "'" || ch === '`') quote = ch
      else if (ch === '{') depth += 1
      else if (ch === '}') depth -= 1
      else if ((ch === '>' || ch === '<') && depth <= 0) {
        closed = true
        break
      }
    }
    if (closed || quote || depth > 0) return null
    return { name: match[1], start: at }
  }
  return null
}
