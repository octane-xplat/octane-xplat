import type { EventData } from '@nativescript/core'
import { GestureEvents, GestureTypes } from '@nativescript/core'
import {
  createGlobalContactCohort,
  type GlobalContactCohort,
  type ContactBirth,
} from './native-contact-stream'

import { retainRawRecognizer } from './raw-recognizers'
import { reserveNativeGesturePolicy, nativePolicyWriter } from './native-policy'
import { interactionTarget } from './target'
import { iosSuspension } from './suspension.ios'
import { inverseGestureTransform, type GestureTransform } from './geometry'
import type { NativeGestureNode, NativeGestureSurface, NativeGestureView } from './input.native'
import type { InputContact, InputFrame } from './owner'

interface IosTouchPayload extends EventData {
  readonly action: 'down' | 'move' | 'up' | 'cancel'
  readonly ios: {
    readonly touches: NSSet<UITouch>
    readonly event: { readonly timestamp: number; readonly allTouches: NSSet<UITouch> | null }
  }
}

interface GestureAttachment {
  readonly type: number
  readonly ios?: unknown
}

const cohorts = new WeakMap<object, GlobalContactCohort>()

function nativePath(view: UIView | null): object[] {
  const path: object[] = []

  for (let next = view; next; next = next.superview) {
    path.push(next)
  }

  return path
}

function windowTransform(view: UIView, window: UIWindow): GestureTransform {
  const origin = view.bounds.origin
  const zero = view.convertPointToView(origin, window)
  const x = view.convertPointToView({ x: origin.x + 1, y: origin.y }, window)
  const y = view.convertPointToView({ x: origin.x, y: origin.y + 1 }, window)

  return {
    a: x.x - zero.x,
    b: x.y - zero.y,
    c: y.x - zero.x,
    d: y.y - zero.y,
    x: zero.x,
    y: zero.y,
  }
}

export function nativeGestureSurface(view: NativeGestureView): NativeGestureSurface {
  // Validate the erased native bridge once at the platform boundary.
  const host = view.nativeViewProtected

  if (!(host instanceof UIView) || !host.window || view.isLoaded === false) {
    throw new Error(
      'Unsupported gesture attachment: iOS gestures require a loaded UIView in a window',
    )
  }

  const window = host.window
  let cohort = cohorts.get(window)

  if (!cohort) {
    cohort = createGlobalContactCohort()
    cohorts.set(window, cohort)
  }

  const windowCohort = cohort
  const target = interactionTarget(host)
  const transform = () =>
    host.window === window ? inverseGestureTransform(windowTransform(host, window)) : null

  let nativeBoundary: object | undefined
  let hitPath: readonly object[] = []
  let observing = false

  return {
    root: window,
    parentBasis() {
      if (host.window !== window) {
        return null
      }

      const logical = view.parent?.nativeViewProtected
      const parent = logical instanceof UIView ? logical : (host.superview ?? window)

      return inverseGestureTransform(windowTransform(parent, window))
    },
    suspension: iosSuspension(view, host),
    host,
    space: { target, local: (point) => transform()?.(point) ?? null, freeze: transform },
    containsHost(other) {
      if (other === host) {
        return true
      }

      // Logical Mason ancestry need not mirror the native view tree.
      const pending: NativeGestureView[] = [view]

      for (let index = 0; index < pending.length; index++) {
        const current = pending[index]

        if (current.nativeViewProtected === other) {
          return true
        }

        current.eachChild?.((child) => {
          pending.push(child)
          return true
        })
      }

      return false
    },
    containsPoint(point) {
      const local = transform()?.(point)
      const size = view.getActualSize?.()

      return Boolean(
        local &&
        size &&
        local.x >= 0 &&
        local.y >= 0 &&
        local.x <= size.width &&
        local.y <= size.height,
      )
    },
    writePolicy: nativePolicyWriter(view.style),
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
        throw new Error('An iOS gesture surface can observe only once')
      }

      observing = true

      const listener = (data: unknown) => {
        // NativeScript's Observable listener type omits the gesture payload.
        const event = data as IosTouchPayload
        const changed = event.ios.touches.allObjects.firstObject

        if (!changed || changed.window !== window) {
          return
        }

        const toContact = (touch: UITouch): InputContact => {
          const position = touch.locationInView(window)
          const screen = window.convertPointToWindow(position, null)

          return {
            id: String(touch.hash),
            kind: touch.type === 2 ? 'pen' : 'touch',
            window: { x: position.x, y: position.y },
            screen: { x: screen.x, y: screen.y },
          }
        }

        const all = event.ios.event.allTouches?.allObjects
        const contacts: InputContact[] = []
        const births: ContactBirth[] = []

        for (let index = 0; index < (all?.count ?? 0); index++) {
          const touch = all!.objectAtIndex(index)

          if (touch.window === window && touch.phase < 3) {
            contacts.push(toContact(touch))
            births.push({
              id: String(touch.hash),
              began: touch.phase === 0,
              time: touch.timestamp * 1000,
            })
          }
        }

        // UIKit may list both new contacts while reporting just one changed touch.
        // Cohort admission follows our first observed down, never collection sizes.
        if (event.action === 'down') {
          nativeBoundary = undefined
          hitPath = nativePath(changed.view)

          const local = transform()?.(changed.locationInView(window))
          const hit = local ? view.elementFromPoint?.(local.x, local.y) : null

          if (hit) {
            // Mason's logical ancestry can differ from UIKit's native ancestry.
            // Use its public hit-test result rather than assuming UIView nesting.
            const logicalPath: object[] = []

            for (let node: NativeGestureNode | null | undefined = hit; node; node = node.parent) {
              const native = node.nativeViewProtected

              if (native && typeof native === 'object') {
                logicalPath.push(native)
                if (
                  !nativeBoundary &&
                  (node.accessibilityRole === 'adjustable' ||
                    node.accessibilityRole === 'slider' ||
                    node.accessibilityRole === 'spinbutton')
                ) {
                  nativeBoundary = native
                }
              }
            }

            hitPath = logicalPath
          }
        }

        const type: InputFrame['type'] = event.action
        const frame: InputFrame = {
          type,
          time: event.ios.event.timestamp * 1000,
          contacts: type === 'cancel' ? [] : contacts,
          changed: toContact(changed),
          hitPath,
          nativeBoundary,
          cohort: windowCohort.observe(type, type === 'cancel' ? [] : births),
          nativeOwned:
            type === 'down' &&
            (births.some((birth) => !birth.began) ||
              hitPath.some(
                (node) =>
                  (typeof UIControl !== 'undefined' && node instanceof UIControl) ||
                  (typeof UITextView !== 'undefined' &&
                    node instanceof UITextView &&
                    (node.editable || node.selectable)) ||
                  (typeof WKWebView !== 'undefined' && node instanceof WKWebView),
              )),
        }

        const key = `${frame.time}:${type}:${frame.changed.id}:${contacts
          .map((contact) => `${contact.id},${contact.window.x},${contact.window.y}`)
          .sort()
          .join(';')}`

        dispatch(frame, key)
      }

      const recognizers: (() => void)[] = []
      const attached = (data: unknown) => {
        const event = data as GestureAttachment

        if (event.type === GestureTypes.touch && event.ios instanceof UIGestureRecognizer) {
          recognizers.push(retainRawRecognizer(event.ios))
        }
      }

      view.on(GestureEvents.gestureAttached, attached)
      try {
        view.on('touch', listener)
      } finally {
        view.off(GestureEvents.gestureAttached, attached)
      }

      return () => {
        observing = false
        try {
          view.off('touch', listener)
        } finally {
          for (const release of recognizers) {
            release()
          }
        }
      }
    },
    reserve(input) {
      return reserveNativeGesturePolicy(view.style, input)
    },
  }
}
