/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './native-slots.css'
import { useState } from 'octane'
import { File, knownFolders, path, View as NativeView } from '@nativescript/core'
import { View } from '@octane-xplat/ui'
import { NativeSurfaces, previewAttached, retainSheetAttachment } from './native-surfaces.tsrx'
import { slots } from './native-slot-content.mobile.tsrx'
import { checkNativeSlot } from './native-slot-check.mobile'
import type { ProbeContext } from '../../probe/context'

let present: ((open: boolean) => void) | undefined

export default function Example() {
  const [open, setOpen] = useState(false)

  present = setOpen
  return <NativeSurfaces open={open} />
}

export async function run(ctx: ProbeContext) {
  await checkNativeSlot(ctx, 'trigger')
  if (ctx.target === 'ios') {
    const file = File.fromPath(
      path.join(knownFolders.documents().path, 'layout-preview-targets.json'),
    )

    ctx.onCleanup(() => file.removeSync())

    const child = slots.get('trigger')!.first!
    const trigger = child.parent instanceof NativeView ? child.parent : child
    const origin = trigger.getLocationOnScreen()!
    const size = trigger.getActualSize()
    const point = { x: origin.x + size.width / 2, y: origin.y + size.height / 2 }

    ctx.record('preview input target', { origin, size, point })
    file.writeTextSync(JSON.stringify({ createdAt: Date.now(), stage: 'open-preview', point }))
    await ctx.waitFor(previewAttached, { timeout: 10000 })
    await checkNativeSlot(ctx, 'preview')
    file.writeTextSync(JSON.stringify({ createdAt: Date.now(), stage: 'dismiss-preview' }))
    await ctx.waitFor(() => !previewAttached(), { timeout: 10000 })
    ctx.assert('OS context menu preview detaches after dismissal', !previewAttached())
  }

  present!(true)
  await ctx.waitFor(() => retainSheetAttachment()(), { timeout: 10000 })
  await checkNativeSlot(ctx, 'sheet')

  const original = slots.get('sheet')!.first
  const sheetAttached = retainSheetAttachment()

  present!(false)
  await ctx.waitFor(() => !sheetAttached(), { timeout: 10000 })
  ctx.assert('sheet native content detaches when closed', !sheetAttached())
  present!(true)
  await ctx.waitFor(() => retainSheetAttachment()(), { timeout: 10000 })
  await checkNativeSlot(ctx, 'sheet')
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
}
