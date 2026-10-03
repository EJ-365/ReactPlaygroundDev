const listeners = new Set<() => void>()
let version = 0

export const editEvents = {
  version: () => version,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  emit() {
    version += 1
    listeners.forEach((listener) => listener())
  },
}
