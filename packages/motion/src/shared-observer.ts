/** One platform subscription, acquired lazily and released with the last reader. */
export type SharedObserver = (notify: () => void) => () => void

export function createSharedObserver(start: SharedObserver): SharedObserver {
  const readers = new Set<{ notify(): void }>()
  let stop: (() => void) | undefined
  let generation = 0

  return (notify) => {
    const reader = { notify }

    readers.add(reader)
    if (readers.size === 1) {
      const token = ++generation
      let release: () => void

      try {
        release = start(() => {
          if (token !== generation) {
            return
          }

          let failure: unknown
          let failed = false

          // A callback may unsubscribe itself/others or subscribe a new reader.
          // eslint-disable-next-line unicorn/no-useless-spread
          for (const entry of [...readers]) {
            if (token !== generation) {
              break
            }

            if (!readers.has(entry)) {
              continue
            }

            try {
              entry.notify()
            } catch (error) {
              if (!failed) {
                failure = error
                failed = true
              }
            }
          }

          if (failed) {
            throw failure
          }
        })
      } catch (error) {
        readers.delete(reader)
        ++generation
        throw error
      }

      if (token === generation && readers.size) {
        stop = release
      } else {
        release()
      }
    }

    return () => {
      if (!readers.delete(reader) || readers.size) {
        return
      }

      ++generation

      const release = stop

      stop = undefined
      release?.()
    }
  }
}
