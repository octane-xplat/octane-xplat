import { NSApplicationDidChangeScreenParametersNotification, NSNotificationCenter, NSScreen } from '@octane-xplat/platform/macos'
import { fromAppKitFrame } from './geometry.macos.js'
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

    return displays.map((display, index) => ({
      id: displayId(display),
      bounds: fromAppKitFrame(display.frame, primary),
      workArea: fromAppKitFrame(display.visibleFrame, primary),
      scaleFactor: display.backingScaleFactor,
      isPrimary: index === 0,
    }))
  },
  (changed) => {
    const center = NSNotificationCenter.defaultCenter
    const token = center.addObserverForNameObjectQueueUsingBlock(
      NSApplicationDidChangeScreenParametersNotification, null, null, changed,
    )
    return () => center.removeObserver(token)
  },
)
