import { useContext, useLayoutEffect, useRef } from 'octane'
import { ReadinessContext } from './readiness-context'
import type { ReadinessRegistration, ReadinessTask } from './readiness-state'

/**
 * Report custom work to the nearest ReadinessScope. Updates/recovery and unmount
 * are automatic; outside a scope reporting is inert. Never include data in labels.
 * @example
 * import { useReadinessTask } from '@octane-xplat/platform/readiness'
 * useReadinessTask({ label: 'Preparing preview', pending: loading, error })
 */
export function useReadinessTask(task: ReadinessTask): void {
  const scope = useContext(ReadinessContext)
  const registration = useRef<ReadinessRegistration | null>(null)
  const { label, pending, error, blocking } = task

  useLayoutEffect(() => {
    if (!scope) {
      return
    }

    const entry = scope.register({ label, pending, error, blocking })

    registration.current = entry
    return () => {
      registration.current = null
      entry.dispose()
    }
  }, [scope])

  useLayoutEffect(() => {
    registration.current?.update({ label, pending, error, blocking })
  }, [scope, label, pending, error, blocking])
}
