import type { View } from '@nativescript/core'
import { layout } from '@nativescript/core/utils'
import type { NSView } from '@octane-xplat/platform/macos'
import {
  notifyLayoutCommit,
  observeLayoutCommits,
  type LayoutCommit,
} from './layout-observers'

const roots = new Map<View, { hostView: NSView }>()

/** Track the Core root for the lifetime of its AppKit content view. */
export function trackNativeScriptRoot(root: View, hostView: NSView) {
  const member = { hostView }
  roots.set(root, member)
  return () => {
    if (roots.get(root) === member) {
      roots.delete(root)
    }
  }
}

export function nativeScriptFontFamilyForView(view: NSView): string | undefined {
  for (let ancestor: NSView | null = view; ancestor; ancestor = ancestor.superview) {
    for (const [root, { hostView }] of roots) {
      if (hostView === ancestor) {
        return root.style.fontFamily
      }
    }
  }
}

export function measureNativeScriptContent(contentView: NSView) {
  for (const [root, member] of roots) {
    if (member.hostView === contentView) {
      const spec = layout.makeMeasureSpec(0, layout.UNSPECIFIED)
      root.measure(spec, spec)
      return {
        width: layout.toDeviceIndependentPixels(root.getMeasuredWidth()),
        height: layout.toDeviceIndependentPixels(root.getMeasuredHeight()),
      }
    }
  }
  return null
}

export function restyleNativeScriptRoots() {
  for (const root of roots.keys()) {
    root._onCssStateChange()
  }
}

export function notifyNativeScriptLayout(root: View) {
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
