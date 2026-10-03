export type TailwindApi = {
  setTailwindConfig: (config: unknown) => void
  generateStylesFromContent: (css: string, content: string[]) => Promise<string>
}

let api: TailwindApi | null = null
const waiters: Array<(api: TailwindApi) => void> = []
const listeners = new Set<() => void>()

export function registerTailwind(next: TailwindApi) {
  api = next
  const pending = waiters.splice(0)
  pending.forEach((waiter) => waiter(next))
  listeners.forEach((listener) => listener())
}

export function getTailwind(timeoutMs: number) {
  if (api) return Promise.resolve(api)
  return new Promise<TailwindApi | null>((resolve) => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs)
    waiters.push((ready) => {
      window.clearTimeout(timer)
      resolve(ready)
    })
  })
}

export function subscribeTailwind(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function tailwindReady() {
  return api != null
}
