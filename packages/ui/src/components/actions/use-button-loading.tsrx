import { useLayoutEffect, useState } from 'octane'
import 'octane/signals'
import { useMediaQuery$ } from '../../internal/platform/use-media-query.tsrx'

const SPINNER_DELAY = 200

/** Keep the busy state immediate while avoiding a brief spinner flash. */
export function useButtonLoading(pending: boolean, isLoading?: boolean, isInterruptible?: boolean) {
  const reducedMotion$ = useMediaQuery$('(prefers-reduced-motion: reduce)')
  const reducedMotion = reducedMotion$.get()
  const immediate = !!isLoading && !isInterruptible
  const busy = pending || !!isLoading
  const delayed = busy && !immediate && !reducedMotion
  const [elapsed, setElapsed] = useState(false)

  useLayoutEffect(() => {
    if (!delayed) {
      setElapsed(false)
      return
    }

    const timer = setTimeout(() => setElapsed(true), SPINNER_DELAY)

    return () => clearTimeout(timer)
  }, [delayed])

  return busy && (!delayed || elapsed)
}
