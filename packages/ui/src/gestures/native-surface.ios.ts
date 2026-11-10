import type { EventData } from '@nativescript/core'
import { gestureLeaves } from './composition'
import { gestureController } from './controller'
import { inverseGestureTransform, type GestureTransform } from './geometry'
import type { NativeGestureSurface, NativeGestureView } from './input.native'
import type { InputContact, InputFrame } from './owner'

interface IosTouchPayload extends EventData {
  readonly action: 'down' | 'move' | 'up' | 'cancel'
  readonly ios: {
    readonly touches: NSSet<UITouch>
    readonly event: { readonly timestamp: number; readonly allTouches: NSSet<UITouch> | null }
  }
}

let targetId = 0

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

  if (!(host instanceof UIView) || !host.window) {
    throw new Error(
      'Unsupported gesture attachment: iOS gestures require a loaded UIView in a window',
    )
  }

  const window = host.window
  const target = Object.freeze({ id: `ios-target:${++targetId}` })
  const transform = () =>
    host.window === window ? inverseGestureTransform(windowTransform(host, window)) : null

  let hitPath: readonly object[] = []
  let observing = false

  return {
    root: window,
    host,
    space: { target, local: (point) => transform()?.(point) ?? null, freeze: transform },
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

          return {
            id: String(touch.hash),
            kind: touch.type === 2 ? 'pen' : 'touch',
            window: position,
            screen: window.convertPointToWindow(position, null),
          }
        }

        const all = event.ios.event.allTouches?.allObjects
        const contacts: InputContact[] = []

        for (let index = 0; index < (all?.count ?? 0); index++) {
          const touch = all!.objectAtIndex(index)

          if (touch.window === window && touch.phase < 3) {
            contacts.push(toContact(touch))
          }
        }

        if (event.action === 'down' && contacts.length === event.ios.touches.count) {
          hitPath = nativePath(changed.view)
        }

        const type: InputFrame['type'] = event.action
        const frame: InputFrame = {
          type,
          time: event.ios.event.timestamp * 1000,
          contacts: type === 'cancel' ? [] : contacts,
          changed: toContact(changed),
          hitPath,
        }

        const key = `${frame.time}:${type}:${frame.changed.id}:${contacts.map((contact) => `${contact.id},${contact.window.x},${contact.window.y}`).join(';')}`

        dispatch(frame, key)
      }

      view.on('touch', listener)
      return () => {
        observing = false
        view.off('touch', listener)
      }
    },
    reserve(input) {
      if (!('touchAction' in view.style)) {
        throw new Error('Unsupported gesture attachment: the iOS host has no touch-action policy')
      }

      const prior = Reflect.get(view.style, 'touchAction')
      let horizontal = false,
        vertical = false

      for (const handle of gestureLeaves(input)) {
        const controller = gestureController(handle)

        horizontal ||= controller.kind === 'pinch' || controller.options.axis !== 'y'
        vertical ||= controller.kind === 'pinch' || controller.options.axis !== 'x'
      }

      const action =
        horizontal && vertical ? 'none' : horizontal ? 'pan-y pinch-zoom' : 'pan-x pinch-zoom'

      Reflect.set(view.style, 'touchAction', action)
      return () => {
        if (Reflect.get(view.style, 'touchAction') === action) {
          Reflect.set(view.style, 'touchAction', prior)
        }
      }
    },
  }
}
