// Nonvisual Chromium: bun run probe run packages/motion/tests/scale-interruption.web.ts --target web
import { Controller } from '../src/controller'
import { attachHost } from '../src/host.web'
import type { Clock } from '../src/clock-types'
import type { ProbeContext } from '../../../tools/probe/context'

export async function run(ctx: ProbeContext) {
  const element = document.createElement('div')
  document.body.append(element)
  let now = 0,
    id = 0
  const frames = new Map<number, () => void>()
  const clock: Clock = {
    now: () => now,
    request(fn) {
      frames.set(++id, fn)
      return id
    },
    cancel(key) {
      frames.delete(key)
    },
  }
  const advance = (ms: number) => {
    now += ms
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((fn) => fn())
  }
  const controller = new Controller(clock)
  ctx.onCleanup(() => {
    controller.destroy()
    element.remove()
  })
  controller.attach(attachHost(element))
  controller.seed({ scale: 1, scaleX: 1, scaleY: 1 })
  const read = () => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform)
    return { x: matrix.a, y: matrix.d }
  }
  const near = (name: string, actual: number, expected: number) => {
    ctx.record(name, { actual, expected })
    ctx.assert(name, Math.abs(actual - expected) < 0.0001, true)
  }
  const first = controller.animate({ scale: 2, scaleX: 2 }, { duration: 1, ease: 'linear' }, false)
  advance(500)
  near('audit effective X', read().x, 2.25)
  near('independent Y', read().y, 1.5)
  ctx.assert('combined tween stays on JS', element.getAnimations().length, 0)
  const second = controller.animate(
    { scaleX: 3, scaleY: 2 },
    { duration: 1, ease: 'linear' },
    false,
  )
  ctx.assert('replacement settles once', await first, 'replaced')
  const animation = element.getAnimations()[0]
  ctx.assert('independent axes accelerated', Boolean(animation), true)
  animation.pause()
  animation.currentTime = 500
  advance(16)
  const pose = read()
  near('WAAPI midpoint X', pose.x, 3.375)
  near('WAAPI midpoint Y', pose.y, 2.25)
  controller.stop()
  await second
  controller.set('opacity', 0.5)
  near('next write preserves X', read().x, pose.x)
  near('next write preserves Y', read().y, pose.y)
  const third = controller.animate(
    { scale: -1, scaleX: 0, scaleY: -2 },
    { duration: 1, ease: 'linear' },
    false,
  )
  advance(1000)
  ctx.assert('negative and zero settle', await third, 'finished')
  near('zero factor', read().x, 0)
  near('negative factors', read().y, 2)
  ctx.assert('no queued JS work', frames.size, 0)
  ctx.record('userAgent', navigator.userAgent)
}
