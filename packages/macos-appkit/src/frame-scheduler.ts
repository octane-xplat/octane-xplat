/** Internal one-shot queue shared by all AppKit animation consumers. */
export interface FrameDriver {
  start(deliver: (time: number) => void): void
  stop(): void
  now(): number
  reportError(error: unknown): void
}

export type FrameScheduler = ReturnType<typeof createFrameScheduler>

export function createFrameScheduler(driver: FrameDriver) {
  const pending = new Map<number, (time: number) => void>()
  let sequence = 0
  let active = false
  let delivering = false
  let generation = 0

  function stop() {
    if (active) {
      active = false
      generation++
      driver.stop()
    }
  }

  function deliver(time: number) {
    // Snapshot IDs, retaining cancellability of callbacks not yet visited.
    const batch = [...pending.keys()]

    delivering = true
    try {
      for (const id of batch) {
        const callback = pending.get(id)

        if (!callback) {
          continue
        }

        pending.delete(id)
        try {
          callback(time)
        } catch (error) {
          driver.reportError(error)
        }
      }
    } finally {
      delivering = false
      if (pending.size === 0) {
        stop()
      }
    }
  }

  function request(callback: (time: number) => void): number {
    const id = ++sequence

    pending.set(id, callback)
    if (!active) {
      active = true

      const lease = ++generation

      try {
        driver.start((time) => {
          if (active && generation === lease) {
            deliver(time)
          }
        })
      } catch (error) {
        pending.delete(id)
        stop()
        throw error
      }
    }

    return id
  }

  function cancel(id: unknown) {
    if (typeof id === 'number') {
      pending.delete(id)
    }

    if (!delivering && pending.size === 0) {
      stop()
    }
  }

  return { request, cancel, now: () => driver.now() }
}
