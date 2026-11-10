/** @jsxImportSource @octane-xplat/jsx */
/// <reference types="@nativescript/types-ios" />
import { File, knownFolders } from '@nativescript/core'
import { View, ScrollableArea, Text } from '@octane-xplat/ui'
import { useInteractionScope$ } from '@octane-xplat/ui'
import type { InteractionScope, Suspension } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../tools/probe/context'

let scope: InteractionScope

export default function ScopeFixture() {
  scope = useInteractionScope$()
  return (
    <View interactionScope={scope} id="scope-root" style={{ height: 700, width: 400 }}>
      <ScrollableArea id="scope-viewport" axis="block" style={{ height: 600 }}>
        <View style={{ height: 3600 }}>
          <Text>Scope qualification</Text>
        </View>
      </ScrollableArea>
    </View>
  )
}

export async function run(ctx: ProbeContext) {
  const host = await ctx.waitFor(() => ctx.find('scope-root'))
  const viewport = await ctx.waitFor(() => ctx.find('scope-viewport'))

  await ctx.waitFor(() => viewport.scrollHeight > viewport.clientHeight)

  const leases: Suspension[] = []

  ctx.onCleanup(() => {
    for (const lease of leases) {
      lease.release()
    }
  })

  viewport.scrollTo({ top: 600, behavior: 'instant' })
  await new Promise((resolve) => setTimeout(resolve, 150))

  const report = File.fromPath(knownFolders.documents().path + '/gesture-scope.json')
  const offsets: number[] = []
  let scheduled = false,
    released = false,
    baseline = 0,
    restoredBaseline = 0

  const original = viewport.style.touchAction
  const lock = async () => {
    baseline = viewport.scrollTop
    for (let index = 0; index < 2; index++) {
      const result = scope.suspend()

      if (!result.ok) {
        throw new Error('Scope freeze rejected: ' + result.reason)
      }

      leases.push(result.lease)
    }

    const started = Date.now()

    while (Date.now() - started < 2300) {
      offsets.push(viewport.scrollTop)
      report.writeTextSync(
        JSON.stringify({
          task: 'gesture-ownership',
          phase: 'locked',
          baseline,
          offsets,
          suspended: scope.suspended$.get(),
          action: viewport.style.touchAction,
        }),
      )

      if (leases.length === 2 && Date.now() - started > 900) {
        leases.pop()!.release()
      }

      await new Promise((resolve) => setTimeout(resolve, 30))
    }

    ctx.assert(
      'overlapping lease remains suspended after first release',
      scope.suspended$.get(),
      true,
    )

    leases.pop()!.release()
    ctx.assert('last release restores suspension state', scope.suspended$.get(), false)
    ctx.assert('viewport touch policy restored', viewport.style.touchAction, original)
    restoredBaseline = viewport.scrollTop
    released = true
    report.writeTextSync(
      JSON.stringify({
        task: 'gesture-ownership',
        phase: 'released',
        at: viewport.getLocationOnScreen(),
        size: viewport.getActualSize(),
        offset: restoredBaseline,
      }),
    )
  }

  const scroll = () => {
    if (!scheduled && Math.abs(viewport.scrollTop - 600) > 2) {
      scheduled = true
      setTimeout(() => {
        void lock()
      }, 40)
    }
  }

  viewport.on('scroll', scroll)
  ctx.onCleanup(() => viewport.off('scroll', scroll))
  report.writeTextSync(
    JSON.stringify({
      task: 'gesture-ownership',
      phase: 'ready',
      at: viewport.getLocationOnScreen(),
      size: viewport.getActualSize(),
      offset: viewport.scrollTop,
    }),
  )

  await ctx.waitFor(() => released, { timeout: 60000, interval: 50 })
  await ctx.waitFor(() => Math.abs(viewport.scrollTop - restoredBaseline) > 30, {
    timeout: 15000,
    interval: 50,
  })

  const maxDrift = Math.max(...offsets.map((offset) => Math.abs(offset - baseline)))

  ctx.record('baseline', baseline)
  ctx.record('offsets', offsets)
  ctx.record('maxDrift', maxDrift)
  ctx.record('afterRelease', viewport.scrollTop)
  ctx.assert('held OS swipe frozen within one logical point', maxDrift < 1, true)
  ctx.assert(
    'independent OS swipe works after release',
    Math.abs(viewport.scrollTop - restoredBaseline) > 30,
    true,
  )
}
