type InstallOutcome = 'accepted' | 'dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: InstallOutcome }>
}

export type InstallState = 'unavailable' | 'available' | 'installed'

let deferred: BeforeInstallPromptEvent | null = null
let state: InstallState = 'unavailable'
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: window-controls-overlay)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export function setupInstall() {
  if (standalone()) state = 'installed'
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    state = 'available'
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    state = 'installed'
    emit()
  })
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => console.warn('Service worker registration failed', error))
    })
  }
}

export const installStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  async prompt() {
    if (!deferred) return false
    const event = deferred
    deferred = null
    await event.prompt()
    const { outcome } = await event.userChoice
    state = outcome === 'accepted' ? 'installed' : 'unavailable'
    emit()
    return outcome === 'accepted'
  },
}
