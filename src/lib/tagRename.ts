import type * as Monaco from 'monaco-editor'
import { isJsxTagStart, VOID_ELEMENTS } from './jsxSyntax'
import { settingsStore } from './settings'

type Tag = { name: string; nameStart: number; nameEnd: number; closing: boolean; selfClosing: boolean }

function tagEnd(text: string, from: number) {
  let quote = ''
  let depth = 0
  for (let at = from; at < text.length; at += 1) {
    const ch = text[at]
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch
    else if (ch === '{') depth += 1
    else if (ch === '}') depth -= 1
    else if (ch === '>' && depth <= 0) return at
    else if (ch === '<' && depth <= 0) return -1
  }
  return -1
}

export function scanTags(text: string, jsx: boolean): Tag[] {
  const tags: Tag[] = []
  const pattern = jsx ? /<(\/?)([A-Za-z][\w$.:-]*)/g : /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<(\/?)([A-Za-z][\w:-]*)/gi
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0
    let closing: boolean
    let name: string
    if (jsx) {
      closing = match[1] === '/'
      name = match[2]
      if (!closing && !isJsxTagStart(text, at)) continue
    } else {
      if (match[0].startsWith('<!--')) continue
      if (match[1]) {
        const open = /^<([A-Za-z]+)/.exec(match[0])
        const close = /<\/([A-Za-z]+)\s*>$/.exec(match[0])
        if (open && close) {
          tags.push({ name: open[1], nameStart: at + 1, nameEnd: at + 1 + open[1].length, closing: false, selfClosing: false })
          const closeAt = at + match[0].length - close[0].length
          tags.push({ name: close[1], nameStart: closeAt + 2, nameEnd: closeAt + 2 + close[1].length, closing: true, selfClosing: false })
        }
        continue
      }
      closing = match[2] === '/'
      name = match[3]
    }
    const nameStart = at + 1 + (closing ? 1 : 0)
    const nameEnd = nameStart + name.length
    const end = tagEnd(text, nameEnd)
    const selfClosing = !closing && ((end > 0 && text[end - 1] === '/') || (!jsx && VOID_ELEMENTS.has(name.toLowerCase())))
    tags.push({ name, nameStart, nameEnd, closing, selfClosing })
  }
  return tags
}

export function matchingTag(text: string, offset: number, jsx: boolean): [Tag, Tag] | null {
  const tags = scanTags(text, jsx)
  const stack: Tag[] = []
  const pairs = new Map<Tag, Tag>()
  for (const tag of tags) {
    if (tag.selfClosing) continue
    if (!tag.closing) {
      stack.push(tag)
      continue
    }
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].name === tag.name || (!jsx && stack[index].name.toLowerCase() === tag.name.toLowerCase())) {
        pairs.set(stack[index], tag)
        pairs.set(tag, stack[index])
        stack.length = index
        break
      }
    }
  }
  const hit = tags.find((tag) => tag.nameStart <= offset && offset <= tag.nameEnd)
  const other = hit && pairs.get(hit)
  return hit && other ? [hit, other] : null
}

export function registerTagRename(monaco: typeof Monaco) {
  const provider: Monaco.languages.LinkedEditingRangeProvider = {
    provideLinkedEditingRanges(model, position) {
      const html = model.getLanguageId() === 'html'
      if (!settingsStore.get().renameTags || (!html && !/\.(jsx|tsx)$/.test(model.uri.path))) return null
      const text = model.getValue()
      const pair = matchingTag(text, model.getOffsetAt(position), !html)
      if (!pair) return null
      return {
        ranges: pair.map((tag) => {
          const start = model.getPositionAt(tag.nameStart)
          const end = model.getPositionAt(tag.nameEnd)
          return new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column)
        }),
        wordPattern: /[A-Za-z][\w$.:-]*/,
      }
    },
  }
  for (const language of ['typescript', 'javascript', 'html']) monaco.languages.registerLinkedEditingRangeProvider(language, provider)
}
