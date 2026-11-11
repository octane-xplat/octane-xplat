import { createObjectDriver } from 'octane/universal/native'
import type { NativeGestureSurface, NativeGestureView } from '../src/gestures/input.native'
import { dispatchNativeGestureInput } from '../src/gestures/input.native'
import { interactionTarget } from '../src/gestures/target'
import type { InputFrame } from '../src/gestures/owner'
import type { ObjectHostContainer } from 'octane/universal/native'

const roots = new WeakMap<object, ObjectHostContainer>()

/** Compiled component/owner fixture only. No platform hit testing or OS input. */
export function createNativeGestureDriver(container: ObjectHostContainer) {
  const driver = createObjectDriver('nativescript')
  const original = driver.getPublicInstance.bind(driver)

  driver.getPublicInstance = (...args) => {
    const host = original(...args)

    if (!host || typeof host !== 'object') {
      throw new Error('Expected an object-driver host')
    }

    roots.set(host, container)
    return Object.assign(host, {
      nativeViewProtected: host,
      isLoaded: true,
      on() {},
      off() {},
      style: {},
    })
  }

  return driver
}

export function nativeGestureSurface(view: NativeGestureView): NativeGestureSurface {
  const root = roots.get(view)

  if (!root) {
    throw new Error('Fixture host was not prepared by createNativeGestureDriver')
  }

  const local = (point: { x: number; y: number }) => ({
    x:
      point.x - ('translateX' in view && typeof view.translateX === 'number' ? view.translateX : 0),
    y:
      point.y - ('translateY' in view && typeof view.translateY === 'number' ? view.translateY : 0),
  })

  return {
    root,
    host: view,
    containsPoint(point) {
      const position = local(point)
      const size = view.getActualSize?.() ?? { width: 1000, height: 1000 }

      return (
        position.x >= 0 && position.y >= 0 && position.x <= size.width && position.y <= size.height
      )
    },
    space: { target: interactionTarget(view), local, freeze: () => (point) => point },
    scheduler: {
      frame(callback) {
        const timer = setTimeout(callback, 0)

        return () => clearTimeout(timer)
      },
      error(error) {
        throw error
      },
    },
    observe: () => () => {},
    reserve: () => () => {},
  }
}

let serial = 0

/** Normalized adapter ingress, separate from the SDK semantic tap channel. */
export function dispatchFixtureContacts(root: ObjectHostContainer, frame: InputFrame): void {
  if (!dispatchNativeGestureInput(root, frame, `fixture:${++serial}`)) {
    throw new Error('No mounted owner for fixture input')
  }
}

export type NativeGestureDriver = ReturnType<typeof createNativeGestureDriver>
