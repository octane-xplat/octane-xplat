const stacks = new Map<string, unknown>()
const regListeners = new Set<(name: string, frame: unknown) => void>()

export function registerStack(name: string, stack: unknown): void {
  stacks.set(name, stack)
  for (const cb of regListeners) {
    cb(name, stack)
  }
}

export function getStack(name: string): unknown {
  return stacks.get(name)
}

export function stackEntries(): IterableIterator<[string, unknown]> {
  return stacks.entries()
}

export function onStackRegistered(cb: (name: string, frame: unknown) => void): () => void {
  regListeners.add(cb)
  return () => {
    regListeners.delete(cb)
  }
}
