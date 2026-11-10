/** Coalesce a callback-ref replacement within one commit; actual host changes still detach. */
export function createInteractionHostRef<Host>(
  attach: (host: Host) => void,
  detach: () => void,
  schedule: (callback: () => void) => void = queueMicrotask,
) {
  let host: Host | null = null,
    reported: Host | null = null,
    generation = 0,
    disposed = false

  return {
    get host() {
      return host
    },
    bind(next: Host | null) {
      if (disposed) {
        return
      }

      const identity = ++generation

      reported = next
      if (!next) {
        schedule(() => {
          if (!disposed && generation === identity && reported === null) {
            host = null
            detach()
          }
        })

        return
      }

      if (host === next) {
        return
      }

      host = null
      detach()
      host = next
      try {
        attach(next)
      } catch (error) {
        host = null
        detach()
        throw error
      }
    },
    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      generation++
      host = null
      reported = null
      detach()
    },
  }
}

export type InteractionHostRef<Host> = ReturnType<typeof createInteractionHostRef<Host>>
