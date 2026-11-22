import type { ViewBase } from '@nativescript/core'
import type { NSView } from '@octane-xplat/platform/macos'
import {
  notifyLayoutCommit,
  observeLayoutCommits,
  type LayoutCommit,
} from './layout-observers'

const roots = new Map<ViewBase, { hostView: NSView }>()

/** Track the Core root for the lifetime of its AppKit content view. */
export function trackNativeScriptRoot(root: ViewBase, hostView: NSView) {
  const member = { hostView }
  roots.set(root, member)
  return () => {
    if (roots.get(root) === member) {
      roots.delete(root)
    }
  }
}

export function restyleNativeScriptRoots() {
  for (const root of roots.keys()) {
    root._onCssStateChange()
  }
}

export function notifyNativeScriptLayout(root: ViewBase) {
  const member = roots.get(root)
  if (member) {
    notifyLayoutCommit(member.hostView)
  }
}

/** Subscribe to completed layouts, including roots already mounted. */
export function observeNativeScriptLayoutCommits(observer: (commit: LayoutCommit) => void) {
  const stop = observeLayoutCommits(observer)
  try {
    for (const { hostView } of [...roots.values()]) {
      observer({ hostView })
    }
  } catch (error) {
    stop()
    throw error
  }
  return stop
}
