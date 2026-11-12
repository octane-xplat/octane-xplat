import { useContext, useLayoutEffect } from 'octane'
import { DevReadinessContext } from './dev-readiness-context'

/** @internal Observable work state used by framework readiness integrations. */
export interface DevReadinessSource<T> {
  /** Read current state. A retired source remains pending until its owner detaches. */
  get(): T
  /** Subscribe without depending on a component rerender. */
  subscribe(notify: () => void): () => void
}

/**
 * @internal Bind a framework work source to the nearest development readiness scope.
 * Missing/retired sources block until replaced or unmounted. Consumer screens
 * normally use useDevReadiness; this hook is for framework service adapters.
 */
export function useDevReadinessSource<T>(
  source: DevReadinessSource<T> | undefined,
  isPending: (value: T) => boolean,
  label: string,
): void {
  const scope = useContext(DevReadinessContext)

  useLayoutEffect(() => {
    if (!scope) {
      return
    }

    let release: (() => void) | undefined
    const update = () => {
      let pending = true

      try {
        if (source) {
          pending = isPending(source.get())
        }
      } catch {
        /* Retired work cannot establish readiness. */
      }

      if (pending) {
        release ??= scope.hold(label)
      } else {
        release?.()
        release = undefined
      }
    }

    const stop = source?.subscribe(update)

    update()
    return () => {
      stop?.()
      release?.()
    }
  }, [scope, source, isPending, label])
}
