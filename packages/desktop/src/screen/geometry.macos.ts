import { NSScreen } from '@octane-xplat/platform/macos'
import type { DesktopRectangle } from './types.js'

export function readAppKitPrimaryFrame(): NSScreen['frame'] | undefined {
  const screens = NSScreen.screens
  return screens.count > 0 ? (screens.objectAtIndex(0) as NSScreen).frame : undefined
}

export function fromAppKitFrame(frame: NSScreen['frame'], primary: NSScreen['frame']): DesktopRectangle {
  const { origin, size } = frame
  return {
    x: origin.x - primary.origin.x,
    y: primary.origin.y + primary.size.height - origin.y - size.height,
    width: size.width,
    height: size.height,
  }
}

export function toAppKitFrame(bounds: DesktopRectangle, primary: NSScreen['frame']): NSScreen['frame'] {
  return {
    origin: {
      x: primary.origin.x + bounds.x,
      y: primary.origin.y + primary.size.height - bounds.y - bounds.height,
    },
    size: { width: bounds.width, height: bounds.height },
  }
}
