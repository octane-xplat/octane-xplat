import { slots, type SlotName } from './native-slot-content.mobile.tsrx'
import type { ProbeContext } from '../../probe/context'

export async function checkNativeSlot(ctx: ProbeContext, name: SlotName) {
  await ctx.waitFor(
    () => {
      const entry = slots.get(name)

      ctx.record(`${name} pending`, {
        first: entry?.first?.getActualSize(),
        second: entry?.second?.getActualSize(),
        location: entry?.first?.getLocationOnScreen(),
        parent: entry?.first?.parent?.typeName,
        root: ctx.find('native-surfaces-root') ? ctx.inspect('native-surfaces-root') : null,
        host: ctx.find('native-effect-host') ? ctx.inspect('native-effect-host') : null,
      })

      return entry?.first && entry.second && entry.first.getActualSize().width > 0
    },
    { timeout: 10000 },
  )

  const { first, second } = slots.get(name)!
  const a = first!.getActualSize(),
    b = second!.getActualSize()

  const origin = first!.getLocationOnScreen(),
    next = second!.getLocationOnScreen()

  ctx.record(name, { first: a, second: b, origin, next })
  ctx.assert(`${name} content fills its host`, Math.abs(a.width - 240) <= 1)
  ctx.assert(
    `${name} ignores child flex growth`,
    Math.abs(a.height - 20) <= 1 && Math.abs(b.height - 20) <= 1,
  )

  ctx.assert(
    `${name} children flow vertically`,
    !!origin && !!next && Math.abs(next.y - origin.y - 20) <= 1,
  )
}

