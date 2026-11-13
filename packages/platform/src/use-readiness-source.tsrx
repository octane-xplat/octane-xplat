import { useContext, useLayoutEffect, useRef } from 'octane'
import { ReadinessContext } from './readiness-context'
import type { ReadinessTask } from './readiness-state'

/** @internal Observable work state used by framework readiness adapters. */
export interface ReadinessSource<T> {
  get(): T
  subscribe(notify: () => void): () => void
}

/** @internal Subscribe directly so unchanged component props cannot hide work changes. */
export function useReadinessSource<T>(
  source: ReadinessSource<T> | undefined,
  describe: (value: T) => Omit<ReadinessTask, 'label'>,
  label: string,
): void {
  const scope = useContext(ReadinessContext)
  const describeRef = useRef(describe)
  const refresh = useRef<(() => void) | undefined>(undefined)

  describeRef.current = describe

  useLayoutEffect(() => {
    if (!scope) {
      return
    }

    const task = scope.register({ label, pending: true })
    const update = () => {
      try {
        task.update({ label, ...(source ? describeRef.current(source.get()) : { pending: true }) })
      } catch {
        // A retired source cannot provide usable data; do not retain its error.
        task.update({ label, pending: false, error: true })
      }
    }

    refresh.current = update

    const stop = source?.subscribe(update)

    update()
    return () => {
      refresh.current = undefined
      stop?.()
      task.dispose()
    }
  }, [scope, source, label])

  useLayoutEffect(() => refresh.current?.(), [describe])
}
