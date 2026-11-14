/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './native-slots.css'
import { useState } from 'octane'
import { File, knownFolders, path } from '@nativescript/core'
import { View } from '@octane-xplat/ui'
import { NativeSurfaces, previewAttached, retainSheetAttachment } from './native-surfaces.tsrx'
import { slots, type SlotName } from './native-slot-content.mobile.tsrx'
import type { ProbeContext } from '../../probe/context'

let present: ((open: boolean) => void) | undefined

export default function Example() {
  const [open, setOpen] = useState(false)

  present = setOpen
  return <NativeSurfaces open={open} />
}

async function check(ctx: ProbeContext, name: SlotName) {
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

export async function run(ctx: ProbeContext) {
  // Retain an effect failure while qualifying the independent native surfaces.
  // Rethrow after teardown so the overall result still fails.
  const failures: unknown[] = []

  try {
    await check(ctx, 'effect')
  } catch (error) {
    failures.push(error)
  }

  await check(ctx, 'trigger')
  if (ctx.target === 'ios') {
    const file = File.fromPath(
      path.join(knownFolders.documents().path, 'layout-preview-targets.json'),
    )

    ctx.onCleanup(() => file.removeSync())

    const trigger = slots.get('trigger')!.first!
    const origin = trigger.getLocationOnScreen()!
    const size = trigger.getActualSize()
    const point = { x: origin.x + size.width / 2, y: origin.y + size.height / 2 }

    file.writeTextSync(JSON.stringify({ createdAt: Date.now(), stage: 'open-preview', point }))
    await ctx.waitFor(previewAttached, { timeout: 10000 })
    await check(ctx, 'preview')
    file.writeTextSync(JSON.stringify({ createdAt: Date.now(), stage: 'dismiss-preview' }))
    await ctx.waitFor(() => !previewAttached(), { timeout: 10000 })
    ctx.assert('OS context menu preview detaches after dismissal', !previewAttached())
  }

  present!(true)
  await ctx.waitFor(() => retainSheetAttachment()(), { timeout: 10000 })
  await check(ctx, 'sheet')

  const original = slots.get('sheet')!.first
  const sheetAttached = retainSheetAttachment()

  present!(false)
  await ctx.waitFor(() => !sheetAttached(), { timeout: 10000 })
  ctx.assert('sheet native content detaches when closed', !sheetAttached())
  present!(true)
  await ctx.waitFor(() => retainSheetAttachment()(), { timeout: 10000 })
  await check(ctx, 'sheet')
  ctx.assert('sheet content survives presentation changes', slots.get('sheet')!.first === original)

  const reopenedSheetAttached = retainSheetAttachment()

  await ctx.mount(View)
  await ctx.waitFor(() => [...slots.values()].every((entry) => !entry.first && !entry.second), {
    timeout: 5000,
  })

  ctx.assert(
    'foreign content refs detach on unmount',
    [...slots.values()].every((entry) => !entry.first && !entry.second),
  )

  await ctx.waitFor(() => !reopenedSheetAttached(), { timeout: 10000 })
  ctx.assert('sheet native content detaches on unmount', !reopenedSheetAttached())

  if (failures.length) {
    throw failures[0]
  }
}
