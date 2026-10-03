export type UpdateStatus = 'idle' | 'checking' | 'current' | 'ready' | 'unsupported' | 'error'

let status: UpdateStatus = 'idle'
let applyRequested = false
let wired = false
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())
const set = (next: UpdateStatus) => {
  if (status === next) return
  status = next
  emit()
}

function ready(reg: ServiceWorkerRegistration) {
  return Boolean(reg.waiting && navigator.serviceWorker.controller)
}

function wire(reg: ServiceWorkerRegistration) {
  if (wired) return
  wired = true
  const track = (worker: ServiceWorker | null) => {
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) set('ready')
    })
  }
  reg.addEventListener('updatefound', () => track(reg.installing))
  track(reg.installing)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applyRequested) window.location.reload()
  })
}

export const updateStore = {
  get: () => status,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  async check() {
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
      set('unsupported')
      return
    }
    set('checking')
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        set('unsupported')
        return
      }
      wire(reg)
      if (ready(reg)) {
        set('ready')
        return
      }
      await reg.update()
      set(ready(reg) ? 'ready' : 'current')
    } catch {
      set('error')
    }
  },
  async apply() {
    applyRequested = true
    const reg = await navigator.serviceWorker.getRegistration().catch(() => undefined)
    if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    else window.location.reload()
  },
}
