import { nativeGestureSurface } from '../../packages/ui/src/gestures/native-surface'
import {
  dispatchNativeGestureInput,
  type NativeGestureView,
  type NativeGestureNode,
  type NativeGestureSurface,
} from '../../packages/ui/src/gestures/input.native'

import type { InputContact, InputFrame } from '../../packages/ui/src/gestures/owner'

let nextWriter = 0

/** Handler/adapter dispatch only. Real input uses the maintained gesture OS
 * fixtures; these samples never pretend to be UITouch or MotionEvent objects. */
export function createGestureDispatch() {
  const writer = ++nextWriter
  let time = 0,
    serial = 0,
    sequence = 0,
    last = 0

  const active = new WeakMap<
    object,
    {
      surface: NativeGestureSurface
      start: { x: number; y: number }
      path: object[]
      cohort: string
    }
  >()

  return {
    restore() {},
    send(host: object, phase: 'start' | 'move' | 'end' | 'cancel', x: number, velocity = 0) {
      if (phase === 'start') {
        // Probe refs come from the NativeScript renderer. Validate the minimal
        // observable boundary before binding that erased host to its named type.
        if (
          !('nativeViewProtected' in host) ||
          !('style' in host) ||
          !('on' in host) ||
          !('off' in host)
        ) {
          throw new Error('Gesture dispatch requires a NativeScript probe ref')
        }

        const view = host as NativeGestureView
        const surface = nativeGestureSurface(view)
        const origin = view.getLocationInWindow?.()

        if (!origin) {
          throw new Error('Gesture dispatch requires a mounted window')
        }

        const path: object[] = []

        for (let node: NativeGestureNode | null | undefined = view; node; node = node.parent) {
          if (node.nativeViewProtected && typeof node.nativeViewProtected === 'object') {
            path.push(node.nativeViewProtected)
          }
        }

        active.set(host, {
          surface,
          start: { x: origin.x + 5, y: origin.y + 5 },
          path,
          cohort: `fixture:${writer}:${++sequence}`,
        })

        last = x
      }

      const run = active.get(host)

      if (!run) {
        throw new Error('Gesture dispatch must begin with start')
      }

      time += velocity ? Math.max(1, Math.abs(((x - last) * 1000) / velocity)) : 20
      last = x

      const contact: InputContact = {
        id: 'fixture:1',
        kind: 'touch',
        window: { x: run.start.x + x, y: run.start.y },
        screen: null,
      }

      const type: InputFrame['type'] =
        phase === 'start' ? 'down' : phase === 'end' ? 'up' : phase === 'cancel' ? 'cancel' : 'move'

      if (
        !dispatchNativeGestureInput(
          run.surface.root,
          {
            type,
            contacts: phase === 'end' || phase === 'cancel' ? [] : [contact],
            changed: contact,
            time,
            hitPath: run.path,
            cohort: run.cohort,
          },
          `fixture-event:${writer}:${++serial}`,
        )
      ) {
        throw new Error('No committed gesture participant in the probe window')
      }

      if (phase === 'end' || phase === 'cancel') {
        active.delete(host)
      }
    },
  }
}

export type GestureDispatch = ReturnType<typeof createGestureDispatch>
