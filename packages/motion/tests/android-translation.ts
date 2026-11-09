// Maintained nonvisual device regression: bun run probe run packages/motion/tests/android-translation.ts --target android
import { Label, Page, isAndroid } from '@nativescript/core'
import { delegatedRun } from '../src/driver'
import { Controller } from '../src/controller'
import { clock } from '../src/clock'
import type { ProbeContext } from '../../../tools/probe/context'
import type { Target } from '../src/types'

export async function run(ctx: ProbeContext) {
  if (!isAndroid) {
    throw new Error('Android density qualification requires Android')
  }

  // ProbeContext.host is supplied by the target adapter, so validate it once.
  const host = ctx.host

  if (!host || typeof host !== 'object' || !('page' in host) || !(host.page instanceof Page)) {
    throw new Error('Expected the native probe Page')
  }

  const page = host.page
  const previous = page.content
  const label = new Label()

  label.text = 'Translation boundary'
  page.content = label
  ctx.onCleanup(() => {
    page.content = previous
  })

  await ctx.waitFor(() => Boolean(label.nativeViewProtected), { timeout: 5000 })

  const view = label.nativeViewProtected
  const density = view.getResources().getDisplayMetrics().density

  ctx.assert('density greater than one', density > 1, true)
  ctx.record('density', density)

  const near = (name: string, actual: number, expected: number, tolerance = 0.5) => {
    ctx.record(name, { actual, expected })
    // NativeScript property commits round translations to the nearest device pixel.
    ctx.assert(name, Math.abs(actual - expected) <= tolerance, true)
  }

  const write = (value: Target) => {
    if (value.x !== undefined) {
      label.translateX = value.x
    }

    if (value.y !== undefined) {
      label.translateY = value.y
    }
  }

  const start = (x: number, delay = 0) =>
    delegatedRun(
      label,
      {
        target: { x },
        dest: { x },
        eff: { x },
        transition: { duration: 0.3, ease: 'linear', delay },
      },
      write,
    )!

  view.setTranslationX(90)

  let run = start(100, 0.2)

  near('90px sample is DIP', run.sample().x!, 90 / density)
  run.cancel()
  ctx.assert('delay cancellation', await run.finished, 'cancelled')
  near('cancel property cache', label.translateX, 90 / density)
  label.translateX = 0
  near('ordinary equal-to-original write reaches native', view.getTranslationX(), 0)
  run = start(100)
  ctx.assert('completion', await run.finished, 'finished')
  near('completion raw endpoint', view.getTranslationX(), 100 * density)
  near('completion cache', label.translateX, 100)
  label.translateX = 0

  // A controlled sampling clock checks velocity on the actual Android view.
  // Two live getters can straddle compositor frames on a busy emulator.
  let time = 0,
    frameId = 0

  const pendingFrames = new Map<number, () => void>()
  const samplingClock = {
    now: () => time,
    request(fn: () => void) {
      pendingFrames.set(++frameId, fn)
      return frameId
    },
    cancel(id: number) {
      pendingFrames.delete(id)
    },
  }

  const sampled = new Controller(samplingClock)

  sampled.seed({ x: 0 })
  sampled.attach({
    read: () => ({ x: 0 }),
    write,
    restore() {},
    delegate: (req) => delegatedRun(label, req, write),
  })

  const delayed = sampled.animate({ x: 100 }, { duration: 1, delay: 5 }, false)

  ctx.onCleanup(() => sampled.destroy())
  for (const dip of [27, 30]) {
    view.setTranslationX(dip * density)
    time += 10

    const callbacks = [...pendingFrames.values()]

    pendingFrames.clear()
    callbacks.forEach((fn) => fn())
  }

  near('native controller sample in DIP', sampled.value('x').get(), 30)
  near('native sampled velocity in DIP per second', sampled.value('x').getVelocity(), 300)
  sampled.stop()
  ctx.assert('sampled delayed stop settlement', await delayed, 'replaced')
  label.translateX = 0

  const controller = new Controller(clock)

  ctx.onCleanup(() => {
    controller.destroy()
  })

  controller.seed({ x: 0 })
  controller.attach({
    read: () => ({ x: 0 }),
    write,
    restore() {},
    delegate: (req) => delegatedRun(label, req, write),
  })

  const first = controller.animate({ x: 100 }, { duration: 5, ease: 'linear' }, false)

  await ctx.waitFor(() => controller.value('x').get() > 10, { timeout: 3000, interval: 10 })
  controller.stop()
  ctx.assert('stop settlement', await first, 'replaced')
  near('stopped public position', controller.value('x').get(), view.getTranslationX() / density)
  near('stopped cache', label.translateX, view.getTranslationX() / density)

  const replacement = controller.animate({ x: 120 }, { duration: 5 }, false)

  await ctx.waitFor(() => controller.value('x').get() > 30, { timeout: 3000, interval: 10 })

  const spring = controller.animate({ x: 0 }, { type: 'spring' }, false)

  ctx.assert('replacement settlement', await replacement, 'replaced')
  near('JS handoff cache', label.translateX, controller.value('x').get())
  near('JS handoff raw', view.getTranslationX(), label.translateX * density)
  ctx.assert('spring completion', await spring, 'finished')
  near('spring endpoint', view.getTranslationX(), 0)
}
