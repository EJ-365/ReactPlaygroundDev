export type Phase = 'booting' | 'building' | 'ready' | 'error'

type StatusSnap = {
  phase: Phase
  notice: string
  line: number
  column: number
  language: string
}

let snap: StatusSnap = {
  phase: 'booting',
  notice: '',
  line: 1,
  column: 1,
  language: 'TypeScript React',
}

const listeners = new Set<() => void>()
let flashTimer = 0

function commit(patch: Partial<StatusSnap>) {
  const next = { ...snap, ...patch }
  if (
    next.phase === snap.phase &&
    next.notice === snap.notice &&
    next.line === snap.line &&
    next.column === snap.column &&
    next.language === snap.language
  ) {
    return
  }
  snap = next
  listeners.forEach((listener) => listener())
}

export const statusStore = {
  get: () => snap,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  setPhase(phase: Phase) {
    commit({ phase })
  },
  setNotice(notice: string) {
    commit({ notice })
  },
  flash(notice: string, ms = 1800) {
    window.clearTimeout(flashTimer)
    commit({ notice })
    flashTimer = window.setTimeout(() => commit({ notice: '' }), ms)
  },
  setCursor(line: number, column: number) {
    commit({ line, column })
  },
  setLanguage(language: string) {
    commit({ language })
  },
}
