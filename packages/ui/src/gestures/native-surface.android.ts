import { Utils } from '@nativescript/core'
import { androidContactFrame, type AndroidContactEvent } from './android-contact'
import { inverseGestureTransform, type GestureTransform } from './geometry'
import { reserveNativeGesturePolicy } from './native-policy'
import type { NativeGestureNode, NativeGestureSurface, NativeGestureView } from './input.native'
import type { Point } from './types'

interface AndroidTouchPayload {
  readonly android: AndroidContactEvent
}

let targetId = 0

function transform(
  view: android.view.View,
  origin: Point,
  density: number,
): GestureTransform | null {
  let a = 1,
    b = 0,
    c = 0,
    d = 1

  for (let current: android.view.View | null = view; current;) {
    const values = Array.create('float', 9)

    current.getMatrix().getValues(values)
    if (values[6] !== 0 || values[7] !== 0 || values[8] !== 1) {
      return null
    }

    const nextA = values[0] * a + values[1] * b
    const nextB = values[3] * a + values[4] * b
    const nextC = values[0] * c + values[1] * d
    const nextD = values[3] * c + values[4] * d

    a = nextA
    b = nextB
    c = nextC
    d = nextD

    const parent = current.getParent()

    current = parent instanceof android.view.View ? parent : null
  }

  // NativeScript reports the transformed local origin in logical window units.
  // Coefficients are dimensionless; the density conversion occurs at contact ingress.
  if (!Number.isFinite(density) || density <= 0) {
    return null
  }

  return { a, b, c, d, x: origin.x, y: origin.y }
}

export function nativeGestureSurface(view: NativeGestureView): NativeGestureSurface {
  const host = view.nativeViewProtected

  if (!(host instanceof android.view.View) || !host.isAttachedToWindow()) {
    throw new Error(
      'Unsupported gesture attachment: Android gestures require a loaded native View in a window',
    )
  }

  const root = host.getRootView()
  const density = Utils.layout.getDisplayDensity()
  const target = Object.freeze({ id: `android-target:${++targetId}` })
  const plane = () => {
    const origin = view.getLocationInWindow?.()

    return origin && host.isAttachedToWindow() && host.getRootView() === root
      ? transform(host, origin, density)
      : null
  }

  const inverse = () => {
    const matrix = plane()

    return matrix ? inverseGestureTransform(matrix) : null
  }

  let hitPath: readonly object[] = [],
    observing = false,
    inSequence = false

  return {
    root,
    host,
    space: { target, local: (point) => inverse()?.(point) ?? null, freeze: inverse },
    scheduler: {
      frame(callback) {
        const id = requestAnimationFrame(callback)

        return () => cancelAnimationFrame(id)
      },
      error(error) {
        queueMicrotask(() => {
          throw error
        })
      },
    },
    observe(dispatch) {
      if (observing) {
        throw new Error('An Android gesture surface can observe only once')
      }

      observing = true

      const listener = (data: unknown) => {
        // NativeScript's Observable listener type erases the raw MotionEvent.
        const event = (data as AndroidTouchPayload).android
        const screen = view.getLocationOnScreen?.(),
          window = view.getLocationInWindow?.(),
          matrix = plane()

        if (!screen || !window || !matrix) {
          return
        }

        const frame = androidContactFrame(
          event,
          {
            density,
            indexedRawCoordinates: android.os.Build.VERSION.SDK_INT >= 29,
            windowOrigin: { x: screen.x - window.x, y: screen.y - window.y },
            vector: (x, y) => ({ x: matrix.a * x + matrix.c * y, y: matrix.b * x + matrix.d * y }),
          },
          hitPath,
        )

        if (!frame) {
          return
        }

        if (frame.type === 'down' && !inSequence) {
          const local = inverse()?.(frame.changed.window)
          const hit = local ? (view.elementFromPoint?.(local.x, local.y) ?? view) : view
          const path: object[] = []

          for (let node: NativeGestureNode | null | undefined = hit; node; node = node.parent) {
            const native = node.nativeViewProtected

            if (native && typeof native === 'object') {
              path.push(native)
            }
          }

          hitPath = path
        }

        const unobservedStart = !inSequence && event.getActionMasked() === 5

        inSequence = frame.contacts.length > 0 && frame.type !== 'cancel'

        const current = { ...frame, hitPath, nativeOwned: unobservedStart }
        const contacts = frame.contacts
          .map((contact) => `${contact.id},${contact.window.x},${contact.window.y}`)
          .sort()
          .join(';')

        dispatch(current, `${frame.time}:${frame.type}:${frame.changed.id}:${contacts}`)
      }

      view.on('touch', listener)
      return () => {
        observing = false
        view.off('touch', listener)
      }
    },
    reserve(input) {
      return reserveNativeGesturePolicy(view.style, input)
    },
  }
}
