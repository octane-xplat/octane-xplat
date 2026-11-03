import { createMacOSRoot } from '@octane-xplat/macos-appkit'
import type { ProbeContext } from '../../../tools/probe/context'
import { NSView } from '@octane-xplat/platform/macos'

/** AppKit handler dispatch only; no OS mouse input or hit-testing. */
export function pan(ctx: ProbeContext, id: string, dx: number, cancelled = false) {
  const view = ctx.find(id)
  const contentView =
    typeof ctx.host === 'object' && ctx.host !== null && 'contentView' in ctx.host
      ? (ctx.host.contentView as NSView)
      : undefined
  const root = createMacOSRoot(contentView)
  try {
    for (const [state, deltaX] of [
      [1, 0],
      [2, dx],
      [cancelled ? 0 : 3, dx],
    ]) {
      ;(root as any).__macosDebug.panView(view, { state, deltaX, deltaY: 0 })
    }
  } finally {
    root.unmount()
  }
}
