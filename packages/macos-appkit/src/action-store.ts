/** Private ID/handler ownership. Native tags are untrusted numbers at ingress. */
export interface ActionRegistration {
  readonly id: number
  setHandler(handler: (() => void) | undefined): void
  release(): void
}

export type ActionStore = ReturnType<typeof createActionStore>

export function createActionStore() {
  const slots = new Map<number, { run(): void; hasHandler(): boolean }>()
  const views = new WeakMap<object, ActionRegistration>()
  let nextId = 1

  function allocate(view?: object): ActionRegistration {
    if (!Number.isSafeInteger(nextId)) {
      throw new Error('AppKit action IDs exhausted')
    }
    const id = nextId++
    let active = true
    let handler: (() => void) | undefined
    const current = () => active && (!view || views.get(view) === lease)
    const lease: ActionRegistration = {
      id,
      setHandler(next) {
        if (current()) {
          handler = next
        }
      },
      release() {
        if (!active) {
          return
        }
        active = false
        handler = undefined
        slots.delete(id)
        if (view && views.get(view) === lease) {
          views.delete(view)
        }
      },
    }
    slots.set(id, {
      run() {
        if (current()) {
          handler?.()
        }
      },
      hasHandler() {
        return current() && typeof handler === 'function'
      },
    })
    if (view) {
      views.set(view, lease)
    }
    return lease
  }

  function dispatch(id: unknown): void {
    if (typeof id === 'number' && Number.isSafeInteger(id) && id > 0) {
      slots.get(id)?.run()
    }
  }

  function idForView(view: object): number | undefined {
    return views.get(view)?.id
  }
  function hasHandler(view: object): boolean {
    const id = idForView(view)
    return id !== undefined && (slots.get(id)?.hasHandler() ?? false)
  }
  return { allocate, dispatch, idForView, hasHandler }
}
