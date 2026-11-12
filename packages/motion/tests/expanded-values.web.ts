// Nonvisual Chromium: bun run probe run packages/motion/tests/expanded-values.web.ts --target web
import { Controller } from '../src/controller'
import { attachHost } from '../src/host.web'
import type { Clock } from '../src/clock-types'
import type { ProbeContext } from '../../../tools/probe/context'

export async function run(ctx: ProbeContext) {
  const parent = document.createElement('div'),
    element = document.createElement('div')
  parent.style.cssText = 'width:400px;height:300px;position:relative'
  element.style.cssText =
    'box-sizing:border-box;width:200px;height:100px;clip-path:inset(0px);position:absolute'
  parent.append(element)
  document.body.append(parent)
  let now = 0,
    id = 0
  const pending = new Map<number, () => void>()
  const clock: Clock = {
    now: () => now,
    request(callback) {
      pending.set(++id, callback)
      return id
    },
    cancel(key) {
      pending.delete(key)
    },
  }
  function step(ms: number) {
    now += ms
    const batch = [...pending]
    for (const [key, callback] of batch) {
      if (pending.delete(key)) {
        callback()
      }
    }
  }
  const controller = new Controller(clock)
  controller.attach(attachHost(element))
  ctx.onCleanup(() => {
    controller.destroy()
    parent.remove()
  })
  controller.seed({ clipPath: 'inset(20% 10% round 12px)', x: '0px' })
  const opening = controller.animate(
    { x: '50%', clipPath: 'inset(0% round 0px)' },
    { duration: 1, ease: 'linear' },
    false,
  )
  step(500)
  ctx.assert(
    'real browser computed clip has resolved inset',
    getComputedStyle(element).clipPath.startsWith('inset(10px'),
    true,
  )
  ctx.assert('expanded playback stays on JS', element.getAnimations().length, 0)
  const before = new DOMMatrix(getComputedStyle(element).transform).m41
  element.style.width = '300px'
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  ctx.assert(
    'resize retains displayed translation',
    new DOMMatrix(getComputedStyle(element).transform).m41,
    before,
  )
  step(500)
  ctx.assert('logical resized run finishes', await opening, 'finished')
  ctx.assert(
    'destination uses resized border box',
    new DOMMatrix(getComputedStyle(element).transform).m41,
    150,
  )
  const sizing = controller.animate({ width: '50%', left: '10%' }, { duration: 0 }, false)
  ctx.assert('layout target finishes', await sizing, 'finished')
  ctx.assert('parent percentage width resolves', element.offsetWidth, 200)
  ctx.assert('position offset resolves', Number.parseFloat(getComputedStyle(element).left), 40)
  controller.seed({ clipPath: 'path("M0 0 L100 0 L100 100 Z")' })
  const active = controller.animate({ x: 200 }, { duration: 1 }, false)
  let rejected = false
  try {
    await controller.animate({ clipPath: 'path("M0 0 Q50 50 100 100 Z")' }, { duration: 1 }, false)
  } catch {
    rejected = true
  }
  ctx.assert('incompatible path rejected', rejected, true)
  step(1000)
  ctx.assert('invalid target did not replace active run', await active, 'finished')
  controller.destroy()
  ctx.assert('original clip restored', element.style.clipPath, 'inset(0px)')
  ctx.assert('no remaining frame requests', pending.size, 0)
  ctx.record('userAgent', navigator.userAgent)
}
