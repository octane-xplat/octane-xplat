import { useContext, useLayoutEffect } from 'octane'
import { derived$, ScopeDisposedError, type DerivedSignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { ReadinessContext } from './readiness-context'
import type { ReadinessSnapshot } from './readiness-state'

/**
 * Observe the nearest scope as a read-only Octane signal, in every build mode.
 * Does not suspend rendering or wait for work. Throws without ReadinessScope.
 * @example
 * import 'octane/signals'
 * import { useReadiness$ } from '@octane-xplat/platform/readiness'
 * const readiness$ = useReadiness$()
 * const loading = readiness$.get().status === 'pending'
 */
export function useReadiness$(): DerivedSignal<ReadinessSnapshot> {
  const scope = useContext(ReadinessContext)

  if (!scope) {
    throw new Error('useReadiness$ requires a ReadinessScope')
  }

  const snapshot$ = useSignal$(scope.snapshot)

  useLayoutEffect(() => {
    const update = () => {
      try {
        snapshot$.set(scope.snapshot())
      } catch (error) {
        // Native owner retirement can precede an ancestor's layout cleanup.
        // Stop this retired reader; other errors must remain observable.
        if (!(error instanceof ScopeDisposedError)) {
          throw error
        }

        stop()
      }
    }

    const stop = scope.subscribe(update)

    update()
    return stop
  }, [scope])

  return derived$(() => snapshot$.get())
}
