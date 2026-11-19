import { lookupGlobal } from '@octane-xplat/lib/capability'
import { createDesktopScreen } from './service.js'
import type { DesktopDisplay, DesktopRectangle, DesktopScreen } from './types.js'

export type * from './types.js'

function invoke(method: 'IsSupported' | 'Read'): string {
  const bridge = lookupGlobal(['NSWinRT', 'dotnet'])
  if (typeof bridge !== 'object' || bridge === null ||
    !('invoke' in bridge) || typeof bridge.invoke !== 'function') {
    throw new Error('This Windows host has no managed desktop display bridge')
  }
  return String(bridge.invoke('', 'OctaneXplat.Desktop.DesktopDisplays', method, []))
}

function isRectangle(value: unknown): value is DesktopRectangle {
  return typeof value === 'object' && value !== null &&
    'x' in value && typeof value.x === 'number' && Number.isFinite(value.x) &&
    'y' in value && typeof value.y === 'number' && Number.isFinite(value.y) &&
    'width' in value && typeof value.width === 'number' && Number.isFinite(value.width) && value.width >= 0 &&
    'height' in value && typeof value.height === 'number' && Number.isFinite(value.height) && value.height >= 0
}

function isDisplay(value: unknown): value is DesktopDisplay {
  return typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'bounds' in value && isRectangle(value.bounds) &&
    'workArea' in value && isRectangle(value.workArea) &&
    'scaleFactor' in value && typeof value.scaleFactor === 'number' &&
    Number.isFinite(value.scaleFactor) && value.scaleFactor > 0 &&
    'isPrimary' in value && typeof value.isPrimary === 'boolean'
}

export const screen: DesktopScreen = createDesktopScreen(
  'physical',
  () => {
    try {
      return invoke('IsSupported') === 'yes'
    } catch {
      return false
    }
  },
  () => {
    const displays: unknown = JSON.parse(invoke('Read'))
    if (!Array.isArray(displays) || !displays.every(isDisplay)) {
      throw new Error('Invalid display data from the Windows host')
    }
    return displays
  },
)
