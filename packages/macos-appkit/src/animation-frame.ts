import { NSObject, NativeClass, interop } from '@octane-xplat/platform/macos'
import { createFrameScheduler } from './frame-scheduler.ts'

interface NativeDisplayLink {
  startWithTargetSelector(target: NSObject, selector: string): boolean
  stop(): void
}

declare const XplatDisplayLink: {
  new: () => NativeDisplayLink
  nowMS(): number
}

function nativeClock() {
  if (typeof XplatDisplayLink === 'undefined') {
    throw new Error('AppKit animations require the XplatDisplayLink native leaf; rebuild the host')
  }

  return XplatDisplayLink
}

let deliver: ((time: number) => void) | undefined
function createTarget(): NSObject {
  class AnimationFrameTarget extends NSObject {
    static ObjCExposedMethods = {
      'frame:': { returns: interop.types.void, params: [interop.types.double] },
    }
    frame(time: number) {
      deliver?.(time)
    }
  }

  // NativeScript's bridge enumerates enumerable prototype methods.
  Object.defineProperty(AnimationFrameTarget.prototype, 'frame', {
    ...Object.getOwnPropertyDescriptor(AnimationFrameTarget.prototype, 'frame'),
    enumerable: true,
  })

  NativeClass(AnimationFrameTarget)

  return AnimationFrameTarget.new()
}

let native: NativeDisplayLink | undefined
let target: NSObject | undefined

const scheduler = createFrameScheduler({
  now: () => nativeClock().nowMS(),
  start(callback) {
    if (typeof XplatDisplayLink === 'undefined') {
      throw new Error(
        'AppKit animations require the XplatDisplayLink native leaf; rebuild the host',
      )
    }

    native ??= XplatDisplayLink.new()
    target ??= createTarget()
    deliver = callback
    if (!native.startWithTargetSelector(target, 'frame:')) {
      throw new Error('AppKit could not start a display link')
    }
  },
  stop() {
    deliver = undefined
    native?.stop()
  },
  reportError: (error) => console.error('[macos-animation-frame] callback failed', error),
})

export const requestAnimationFrame = scheduler.request
export const cancelAnimationFrame = scheduler.cancel
export const animationNow = scheduler.now
