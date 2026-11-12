import { createSharedObserver, type SharedObserver } from './shared-observer'

export function readReducedMotion(): boolean {
  return Boolean(
    (globalThis as any).NSWorkspace?.sharedWorkspace?.accessibilityDisplayShouldReduceMotion,
  )
}

function startObservation(notify: () => void): () => void {
  const platform = globalThis as any
  const workspace = platform.NSWorkspace?.sharedWorkspace
  // AppKit posts accessibility display changes on the workspace's center,
  // not NSNotificationCenter.defaultCenter. Retain it for matching cleanup.
  const center = workspace?.notificationCenter

  if (!center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) {
    return () => {}
  }

  let active = true
  const observer = center.addObserverForNameObjectQueueUsingBlock(
    platform.NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification ??
      'NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification',
    workspace,
    platform.NSOperationQueue?.mainQueue ?? null,
    () => {
      if (active) {
        notify()
      }
    },
  )

  return () => {
    if (!active) {
      return
    }

    active = false
    center.removeObserver(observer)
  }
}

/** Share one platform observer across all mounted Motion readers. */
export const observeReducedMotion: SharedObserver = createSharedObserver(startObservation)
