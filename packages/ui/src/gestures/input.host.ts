import type { GestureScheduler, InputFrame } from './owner'
import type { ActivationEvent, GestureInput, InteractionScope, Point } from './types'
import type { PressOptions } from './press'
import { gestureLeaves } from './composition'
import { gestureController } from './controller'
import { observeGesturePolicy } from './gesture-policy'
import { interactionTarget } from './target'
import { freezeGestureBasis } from './geometry'
import {
  attachNativeGesture,
  attachNativeInteractionScope,
  attachNativePress,
  parentGestureSurface,
  type NativeGestureSurface,
} from './input.native'

/** Runtime-neutral bridge shape. Native conversion and event ownership stay in the host. */
export interface HostGestureSurface {
  readonly root: object
  readonly host: object
  claim?(): boolean
  local(point: Point): Point | null
  parentBasis?(): ((point: Point) => Point) | null
  freeze?(): ((point: Point) => Point) | null
  parentLocal?(point: Point): Point | null
  containsPoint(point: Point): boolean
  containsHost(host: object): boolean
  observe(dispatch: (frame: InputFrame, identity: string) => void): () => void
}

export interface HostGestureBridge {
  gestureSurface?(view: object): HostGestureSurface
  observeGestureActivation?(
    view: object,
    notify: (source: ActivationEvent['source'], kind?: 'double' | 'long') => void,
  ): () => void
}

/** One-mouse-contact integration, not direct-touch policy or momentum suspension. */
export function createMouseGestureAdapter(
  platform: string,
  bridge: () => HostGestureBridge | undefined,
  scheduler: GestureScheduler,
) {
  function validate(input: GestureInput): void {
    for (const handle of gestureLeaves(input)) {
      const controller = gestureController(handle)

      if (
        controller.kind === 'pinch' ||
        (controller.options.pointers?.min ?? 1) !== 1 ||
        (controller.options.pointers?.max ?? 1) !== 1
      ) {
        throw new Error(
          `Unsupported ${platform} gesture attachment: this adapter supports one mouse contact; direct-touch pinch and trackpad magnification are unavailable`,
        )
      }
    }
  }

  function surface(view: object): NativeGestureSurface {
    const input = bridge()?.gestureSurface?.(view)

    if (!input) {
      throw new Error(
        `Unsupported ${platform} gesture attachment: raw mouse input bridge unavailable`,
      )
    }

    return {
      ...input,
      parentBasis: input.parentLocal
        ? () => freezeGestureBasis((point) => input.parentLocal!(point))
        : input.parentBasis
          ? () => input.parentBasis!()
          : undefined,
      space: {
        target: interactionTarget(input.host),
        local: (point) => input.local(point),
        freeze: () =>
          input.freeze ? input.freeze() : freezeGestureBasis((point) => input.local(point)),
      },
      scheduler: { ...scheduler, claim: input.claim ? () => input.claim!() : scheduler.claim },
      // Mouse observation does not reserve touch scrolling or trackpad magnification.
      reserve: (input) => observeGesturePolicy(input, () => validate(input)),
    }
  }

  return {
    gesture(view: object, input: GestureInput, basis: 'host' | 'parent' = 'host'): () => void {
      validate(input)

      const host = surface(view)

      return attachNativeGesture(basis === 'parent' ? parentGestureSurface(host) : host, input)
    },
    scope(view: object, scope: InteractionScope): () => void {
      return attachNativeInteractionScope(surface(view), scope)
    },
    press(view: object, options: PressOptions) {
      return attachNativePress(surface(view), options, (registration) => {
        if (options.observeOnly) {
          return { commit() {}, dispose() {} }
        }

        const dispose = bridge()?.observeGestureActivation?.(view, (source, kind) => {
          if (kind === 'long') {
            registration.longPress(source)
          } else {
            registration.activate(source, undefined, kind)
          }
        })

        if (!dispose) {
          throw new Error(
            `Unsupported ${platform} press attachment: semantic activation bridge unavailable`,
          )
        }

        return { commit() {}, dispose }
      })
    },
  }
}

export type MouseGestureAdapter = ReturnType<typeof createMouseGestureAdapter>
export type HostPressBinding = ReturnType<MouseGestureAdapter['press']>
