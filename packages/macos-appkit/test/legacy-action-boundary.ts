// Adapter for existing source-slice branch tests. These stand-ins deliberately
// expose the old fake maps; lease correctness is tested with production stores.
export function legacyActionBoundary(context: Record<string, any>) {
  const handlers = context.actionHandlers ?? new Map()
  const ids = context.actionIdsByView ?? new WeakMap()
  let next = context.nextActionId ?? 1
  const registrations = new WeakMap()
  const allocate = (view?: object) => {
    const id = next++
    let active = true

    handlers.set(id, null)
    if (view) {
      ids.set(view, id)
    }

    return {
      id,
      setHandler(handler: unknown) {
        if (active) {
          handlers.set(id, handler ?? null)
        }
      },
      release() {
        active = false
        handlers.delete(id)
        if (view && ids.get(view) === id) {
          ids.delete(view)
        }
      },
    }
  }

  const adoptAction = (node: any, action: any) => {
    registrations.get(node)?.release()
    registrations.set(node, action)
    node.actionId = action.id
    return action.id
  }

  return {
    allocate,
    adoptAction,
    acquireAction: (node: any, view: object) => adoptAction(node, allocate(view)),
    setNodeHandler: (node: any, handler: unknown) => {
      if (registrations.has(node)) {
        registrations.get(node).setHandler(handler)
      } else {
        handlers.set(node.actionId, handler ?? null)
      }
    },
    idForView: (view: object) => ids.get(view),
    hasHandler: (view: object) => typeof handlers.get(ids.get(view)) === 'function',
    invokeAction: (id: number) => handlers.get(id)?.(),
  }
}
