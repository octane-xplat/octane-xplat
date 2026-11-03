import { evaluateNativeMediaQuery } from './media-query-native'
import { readReducedMotion } from './animation-host.macos'

/** @internal The subset of the AppKit host used by responsive hooks. */
export interface AppKitMediaQueryHost {
  readonly windowSize?: { width: number; height: number }
  onWindowResize?: (notify: () => void) => () => void
}

/** AppKit posts accessibility display changes on the workspace's own
 *  notification center, not NSNotificationCenter.defaultCenter. */
function observeReducedMotion(notify: () => void): () => void {
  const platform = globalThis as Record<string, any>
  const workspace = platform.NSWorkspace?.sharedWorkspace
  const center = workspace?.notificationCenter
  if (!center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) {
    return () => {}
  }
  const observer = center.addObserverForNameObjectQueueUsingBlock(
    platform.NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification ??
      'NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification',
    workspace,
    platform.NSOperationQueue?.mainQueue ?? null,
    notify,
  )
  return () => center.removeObserver(observer)
}

/** @internal Snapshot only the match boolean: the host may allocate a fresh
 * window-size object on each read, which is not a stable external snapshot. */
export function createAppKitMediaQuerySource(query: string, host?: AppKitMediaQueryHost) {
  return {
    subscribe: (notify: () => void): (() => void) => {
      const releaseResize = host?.onWindowResize?.(notify) ?? (() => {})
      const releaseMotion = observeReducedMotion(notify)
      return () => {
        releaseResize()
        releaseMotion()
      }
    },
    getSnapshot: (): boolean => {
      const size = host?.windowSize
      if (!size) {
        return false
      }
      return evaluateNativeMediaQuery(query, {
        width: size.width,
        height: size.height,
        coarse: false,
        hover: true,
        reducedMotion: readReducedMotion(),
      })
    },
  }
}
