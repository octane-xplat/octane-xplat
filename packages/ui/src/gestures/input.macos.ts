import { hostGlobal } from '../internal/platform/host-bridge'
import {
  attachNativeGesture,
  parentGestureSurface,
  attachNativeInteractionScope,
  attachNativePress,
  type NativeGestureSurface,
} from './input.native'

import { interactionTarget } from './target'
import { gestureLeaves } from './composition'
import { gestureController } from './controller'
import type { ActivationEvent, GestureInput, InteractionScope, Point } from './types'
import type { InputFrame } from './owner'
import type { PressOptions } from './press'

interface AppKitSurface {
  readonly root: object
  readonly host: object
  local(point: Point): Point | null
  parentBasis?(): ((point: Point) => Point) | null
  freeze(): ((point: Point) => Point) | null
  containsPoint(point: Point): boolean
  containsHost(host: object): boolean
  observe(dispatch: (frame: InputFrame, identity: string) => void): () => void
}

interface AppKitGestureBridge {
  gestureSurface?(view: object): AppKitSurface
  observeGestureActivation?(
    view: object,
    notify: (source: ActivationEvent['source'], kind?: 'double' | 'long') => void,
  ): () => void
}

function surface(view: object): NativeGestureSurface {
  const bridge = hostGlobal<AppKitGestureBridge>('__xplatAppKit')
  const input = bridge?.gestureSurface?.(view)

  if (!input) {
    throw new Error('Unsupported AppKit gesture attachment: raw mouse input bridge unavailable')
  }

  return {
    ...input,
    parentBasis: input.parentBasis ? () => input.parentBasis!() : undefined,
    space: {
      target: interactionTarget(input.host),
      local: (point) => input.local(point),
      freeze: () => input.freeze(),
    },
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
    // Mouse contacts do not reserve direct touch scrolling or trackpad magnification.
    reserve() {
      return () => {}
    },
  }
}

export function attachAppKitGesture(
  view: object,
  input: GestureInput,
  basis: 'host' | 'parent' = 'host',
): () => void {
  for (const handle of gestureLeaves(input)) {
    const controller = gestureController(handle)

    if (
      controller.kind === 'pinch' ||
      (controller.options.pointers?.min ?? 1) !== 1 ||
      (controller.options.pointers?.max ?? 1) !== 1
    ) {
      throw new Error(
        'Unsupported AppKit gesture attachment: this adapter supports one mouse contact; direct-touch pinch and trackpad magnification are unavailable',
      )
    }
  }

  const host = surface(view)

  return attachNativeGesture(basis === 'parent' ? parentGestureSurface(host) : host, input)
}

export function attachAppKitScope(view: object, scope: InteractionScope): () => void {
  // AppKit scroll/momentum suspension is not qualified. The operation returns unsupported.
  return attachNativeInteractionScope(surface(view), scope)
}

export function attachAppKitPress(view: object, options: PressOptions) {
  const bridge = hostGlobal<AppKitGestureBridge>('__xplatAppKit')

  return attachNativePress(surface(view), options, (registration) => {
    if (options.observeOnly) {
      return { commit() {}, dispose() {} }
    }

    const dispose = bridge?.observeGestureActivation?.(view, (source, kind) => {
      if (kind === 'long') {
        registration.longPress(source)
      } else {
        registration.activate(source, undefined, kind)
      }
    })

    if (!dispose) {
      throw new Error('Unsupported AppKit press attachment: semantic activation bridge unavailable')
    }

    return { commit() {}, dispose }
  })
}

export type AppKitPressBinding = ReturnType<typeof attachAppKitPress>
