import {
  requestAnimationFrame,
  cancelAnimationFrame,
  animationNow,
} from '../../src/animation-frame'

import { createCssAnimations } from '../../src/css-animations'
import { createAnimatedValue } from '../../../ui/src/internal/platform/animated-value'
import { clock } from '../../../motion/src/clock.macos'
import { NSThread, NSObject, NativeClass, interop } from '@octane-xplat/platform/macos'
import { computeCascade, registerStylesheet, unregisterStylesheet } from '@octane-xplat/css-engine'

// Native-only diagnostic contract, not a package API.
declare const XplatDisplayLink: {
  new: () => {
    startWithTargetSelector(target: NSObject, selector: string): boolean
    stop(): void
    running: boolean
    deliveryCount: number
    backend: string
  }
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw Error(message)
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export async function checkAnimationFrames() {
  const cancelled = requestAnimationFrame(() => {
    throw Error('cancelled callback ran')
  })

  cancelAnimationFrame(cancelled)

  const times: number[] = []
  let cancelPeer: unknown

  await new Promise<void>((resolve) => {
    requestAnimationFrame((time) => {
      check(NSThread.isMainThread, 'callback must run on main thread')
      check(Math.abs(performance.now() - time) < 100, 'frame and host clock epochs differ')
      check(Math.abs(clock.now() - time) < 100, 'Motion clock epoch differs')
      times.push(time)
      cancelAnimationFrame(cancelPeer)
      requestAnimationFrame((next) => {
        check(next > time, 'nested callback must run on a later frame')
        times.push(next)
        resolve()
      })
    })

    requestAnimationFrame((time) => check(time === times[0], 'batch timestamps differ'))
    cancelPeer = requestAnimationFrame(() => {
      throw Error('cancelled peer ran')
    })
  })

  const samples: number[] = []
  const value = createAnimatedValue(0, {
    now: () => performance.now(),
    request: requestAnimationFrame,
    cancel: cancelAnimationFrame,
    write: (_view, next) => samples.push(next),
  })

  value.ref({})

  const result = await value.to(1, { duration: 120 })

  check(result.status === 'finished' && value.value === 1, 'imperative animation did not finish')
  check(
    samples.some((x) => x > 0 && x < 1),
    'imperative animation lacks intermediate frames',
  )

  value.dispose()

  registerStylesheet(
    'display-link-runtime',
    '@keyframes fade { from { opacity: 0; } to { opacity: 1; } } .display-fade { animation: fade .12s linear forwards; }',
  )

  const node: any = {
    type: 'masonview',
    cssType: 'masonview',
    cssClasses: new Set(['display-fade']),
    cssPseudoClasses: new Set(),
    props: {},
    children: [],
    parent: null,
    view: { frame: { size: { width: 20, height: 20 } } },
    computedStyle: {},
  }

  const overlays: number[] = []
  const css = createCssAnimations({
    nativeStyle: {
      applyStyle(node) {
        overlays.push(Number(node.animatedStyle?.opacity))
      },
    },
  })

  try {
    css.playKeyframeAnimations(node, computeCascade(node).animations)
    await delay(240)
    check(
      overlays.some((x) => x > 0 && x < 1) && overlays.at(-1) === 1,
      'CSS animation did not advance and finish',
    )

    css.stopSubtreeAnimations(node)

    const count = overlays.length

    await delay(60)
    check(overlays.length === count, 'retired CSS still writes')
  } finally {
    css.stopSubtreeAnimations(node)
    unregisterStylesheet('display-link-runtime')
  }

  let ticks = 0
  class Target extends NSObject {
    static ObjCExposedMethods = {
      'tick:': { returns: interop.types.void, params: [interop.types.double] },
    }
    tick(time: number) {
      check(NSThread.isMainThread && time <= animationNow(), 'invalid native delivery')
      ticks++
    }
  }

  Object.defineProperty(Target.prototype, 'tick', {
    ...Object.getOwnPropertyDescriptor(Target.prototype, 'tick'),
    enumerable: true,
  })

  NativeClass(Target)

  const native = XplatDisplayLink.new()
  const target = Target.new()

  check(native.startWithTargetSelector(target, 'tick:'), 'native start failed')
  await delay(100)
  check(ticks > 1 && native.running, 'native driver did not tick')
  native.stop()

  const delivered = Number(native.deliveryCount)

  await delay(100)
  check(
    !native.running && Number(native.deliveryCount) === delivered,
    'native driver did not become idle',
  )

  check(native.startWithTargetSelector(target, 'tick:'), 'native restart failed')
  await delay(60)
  native.stop()
  check(Number(native.deliveryCount) > delivered, 'native restart did not deliver')
  console.log(
    'APPKIT_DISPLAY_LINK_STATE ' +
      JSON.stringify({
        backend: String(native.backend),
        times,
        imperativeSamples: samples.length,
        cssSamples: overlays.length,
        nativeDeliveries: Number(native.deliveryCount),
      }),
  )
}
