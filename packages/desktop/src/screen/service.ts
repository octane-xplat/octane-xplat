import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopDisplay, DesktopDisplayMetric, DesktopRectangle, DesktopScreen, DesktopScreenEvents } from './types.js'

function sameRectangle(a: DesktopRectangle | undefined, b: DesktopRectangle | undefined) {
  return a === b || (a !== undefined && b !== undefined &&
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height)
}

function copyDisplay(display: DesktopDisplay): DesktopDisplay {
  return {
    ...display,
    bounds: { ...display.bounds },
    ...(display.workArea ? { workArea: { ...display.workArea } } : {}),
  }
}

export function createDesktopScreen(
  coordinateSpace: DesktopScreen['coordinateSpace'],
  isSupported: () => boolean,
  read: () => DesktopDisplay[],
  watch?: (changed: () => void) => () => void,
): DesktopScreen {
  function getAllDisplays() {
    if (!isSupported()) throw new UnavailabilityError('screen')
    return read()
  }

  const listeners: { [Event in keyof DesktopScreenEvents]: DesktopScreenEvents[Event][] } = {
    'display-added': [],
    'display-removed': [],
    'display-metrics-changed': [],
  }
  let stopWatching: (() => void) | undefined

  function startWatching() {
    if (!watch || !isSupported()) throw new UnavailabilityError('screen.on')

    const capture = () => new Map(read().map((display) => [display.id, display]))
    let previous = capture()
    let queued = false
    let active = true
    function emit(event: keyof DesktopScreenEvents, display: DesktopDisplay, changes: DesktopDisplayMetric[] = []) {
      for (const listener of listeners[event].slice()) {
        if (!active) return
        try {
          listener({ type: event }, copyDisplay(display), changes.slice())
        } catch (error) {
          console.error('[desktop] display listener failed', error)
        }
      }
    }

    const stop = watch(() => {
      if (!active || queued) return
      queued = true
      void Promise.resolve().then(() => {
        queued = false
        if (!active) return
        try {
          const current = capture()
          const before = previous
          previous = current
          for (const [id, display] of before) {
            if (!current.has(id)) emit('display-removed', display)
          }
          for (const [id, display] of current) {
            const old = before.get(id)
            if (!old) {
              emit('display-added', display)
              continue
            }
            const changes: DesktopDisplayMetric[] = []
            if (!sameRectangle(display.bounds, old.bounds)) changes.push('bounds')
            if (!sameRectangle(display.workArea, old.workArea)) changes.push('workArea')
            if (display.scaleFactor !== old.scaleFactor) changes.push('scaleFactor')
            if (display.isPrimary !== old.isPrimary) changes.push('isPrimary')
            if (changes.length) emit('display-metrics-changed', display, changes)
          }
        } catch (error) {
          console.error('[desktop] display snapshot failed', error)
        }
      })
    })
    return () => {
      active = false
      stop()
    }
  }

  return {
    get supported() {
      return isSupported()
    },
    coordinateSpace,
    getAllDisplays,
    on(event, listener) {
      if (!Object.hasOwn(listeners, event) || typeof listener !== 'function') {
        throw new TypeError('Expected a display event and listener')
      }
      stopWatching ??= startWatching()
      listeners[event].push(listener)
      return this
    },
    off(event, listener) {
      if (!Object.hasOwn(listeners, event)) throw new TypeError('Unknown display event')
      const registrations = listeners[event]
      const index = registrations.lastIndexOf(listener)
      if (index >= 0) registrations.splice(index, 1)
      if (Object.values(listeners).every((callbacks) => callbacks.length === 0)) {
        const stop = stopWatching
        stopWatching = undefined
        stop?.()
      }
      return this
    },
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
