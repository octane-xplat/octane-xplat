export type ActionActivationSource = 'pointer' | 'keyboard' | 'accessibility' | 'virtual'

/** Private ID/handler ownership. Native tags are untrusted numbers at ingress. */
export interface ActionRegistration {
  readonly id: number
  setHandler(handler: ((source: ActionActivationSource) => void) | undefined): void
  release(): void
}

export type ActionStore = ReturnType<typeof createActionStore>

export function createActionStore() {
  const slots = new Map<
    number,
    { run(source: ActionActivationSource): void; hasHandler(): boolean }
  >()

  const views = new WeakMap<object, ActionRegistration>()
  const activations = new WeakMap<object, (source: ActionActivationSource) => void>()
  let nextId = 1

  function allocate(view?: object): ActionRegistration {
    if (!Number.isSafeInteger(nextId)) {
      throw new Error('AppKit action IDs exhausted')
    }

    const id = nextId++
    let active = true
    let handler: ((source: ActionActivationSource) => void) | undefined
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
      run(source) {
        if (current()) {
          handler?.(source)
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

  function dispatch(id: unknown, source: ActionActivationSource = 'virtual'): void {
    if (typeof id === 'number' && Number.isSafeInteger(id) && id > 0) {
      slots.get(id)?.run(source)
    }
  }

  function idForView(view: object): number | undefined {
    return views.get(view)?.id
  }

  function hasHandler(view: object): boolean {
    const id = idForView(view)

    return id !== undefined && (slots.get(id)?.hasHandler() ?? false)
  }

  function observeActivation(
    view: object,
    notify: (source: ActionActivationSource) => void,
  ): () => void {
    if (activations.has(view)) {
      throw new Error('Managed activation already attached')
    }

    activations.set(view, notify)
    return () => {
      if (activations.get(view) === notify) {
        activations.delete(view)
      }
    }
  }

  function deliverActivation(view: object, source: ActionActivationSource): boolean {
    const notify = activations.get(view)

    if (!notify) {
      return false
    }

    notify(source)
    return true
  }

  return { allocate, dispatch, idForView, hasHandler, observeActivation, deliverActivation }
}
