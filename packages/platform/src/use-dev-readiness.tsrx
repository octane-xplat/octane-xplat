import { useContext, useLayoutEffect } from 'octane'
import { DevReadinessContext } from './dev-readiness-context'

/**
 * Report component-owned pending work to the nearest DevActionScope. Updates and
 * unmount release the lease automatically; outside a scope this is inert.
 * @example
 * import { useDevReadiness } from '@octane-xplat/platform/dev-actions'
 * if (import.meta.env.DEV) useDevReadiness(loading, 'Loading checkout')
 */
export function useDevReadiness(pending: boolean, label: string): void {
  const scope = useContext(DevReadinessContext)

  useLayoutEffect(() => {
    if (pending && scope) {
      return scope.hold(label)
    }
  }, [scope, pending, label])
}
