import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopDisplay, DesktopRectangle, DesktopScreen } from './types.js'

export function createDesktopScreen(
  coordinateSpace: DesktopScreen['coordinateSpace'],
  isSupported: () => boolean,
  read: () => DesktopDisplay[],
): DesktopScreen {
  function getAllDisplays() {
    if (!isSupported()) throw new UnavailabilityError('screen')
    return read()
  }

  return {
    get supported() {
      return isSupported()
    },
    coordinateSpace,
    getAllDisplays,
    getPrimaryDisplay() {
      return getAllDisplays().find((display) => display.isPrimary)
    },
    getDisplayMatching(bounds) {
      const { x, y, width, height } = bounds
      if (![x, y, width, height].every(Number.isFinite) || width < 0 || height < 0) {
        throw new RangeError('Display matching requires finite coordinates and a nonnegative size')
      }

      let match: DesktopDisplay | undefined
      let largestOverlap = -1
      let nearestDistance = Infinity
      for (const display of getAllDisplays()) {
        const rect = display.bounds
        const horizontal = Math.min(x + width, rect.x + rect.width) - Math.max(x, rect.x)
        const vertical = Math.min(y + height, rect.y + rect.height) - Math.max(y, rect.y)
        const overlap = Math.max(0, horizontal) * Math.max(0, vertical)
        const distance = Math.hypot(Math.min(0, horizontal), Math.min(0, vertical))
        if (overlap > largestOverlap || (overlap === largestOverlap &&
          (distance < nearestDistance || (distance === nearestDistance && display.isPrimary)))) {
          match = display
          largestOverlap = overlap
          nearestDistance = distance
        }
      }
      return match
    },
  }
}
