import { NSScreen } from '@octane-xplat/platform/macos'
import { createDesktopScreen } from './service.js'
import type { DesktopScreen } from './types.js'

export type * from './types.js'

function displayId(display: NSScreen): string {
  const value: unknown = display.deviceDescription.objectForKey('NSScreenNumber')
  const id = typeof value === 'object' && value !== null && 'unsignedIntValue' in value
    ? value.unsignedIntValue : value
  if (typeof id !== 'number' && typeof id !== 'bigint') {
    throw new Error('AppKit did not return a display ID')
  }
  return String(id)
}

export const screen: DesktopScreen = createDesktopScreen(
  'logical',
  () => typeof NSScreen !== 'undefined',
  () => {
    const screens = NSScreen.screens
    const displays = Array.from({ length: screens.count }, (_, index) =>
      screens.objectAtIndex(index) as NSScreen)
    const primary = displays[0]?.frame
    if (!primary) return []

    const top = primary.origin.y + primary.size.height
    const convert = ({ origin, size }: NSScreen['frame']) => ({
      x: origin.x - primary.origin.x,
      y: top - origin.y - size.height,
      width: size.width,
      height: size.height,
    })
    return displays.map((display, index) => ({
      id: displayId(display),
      bounds: convert(display.frame),
      workArea: convert(display.visibleFrame),
      scaleFactor: display.backingScaleFactor,
      isPrimary: index === 0,
    }))
  },
)
