/** @jsxImportSource @octane-xplat/jsx */
import { View, ScrollableArea, Text } from '@octane-xplat/ui'
import { suspendScrollInput } from '../../src/ios/scroll-input.ios'
import type { ProbeContext } from '../../../../tools/probe/context'

// Requires a locally installed Mason artifact with userScrollEnabled and a fresh native build.
// This tests native binding/offsets, not OS touch delivery.
export default function Fixture() {
  return <View style={{ height: 600, width: 300, flexShrink: 0 }}>
    <ScrollableArea id="locked-area" axis="block" height={400} width={280}>
      <View style={{ width: 900, height: 2000, minHeight: 2000, flexShrink: 0 }}>
        <Text>Native suspension qualification</Text>
      </View>
    </ScrollableArea>
  </View>
}

export async function run(ctx: ProbeContext) {
  const host = ctx.find('locked-area')
  await ctx.waitFor(() => !!host?.nativeViewProtected, { timeout: 10000 })
  ctx.record('initial geometry', { height: host.clientHeight, extent: host.scrollHeight })
  await ctx.waitFor(
    () => host.scrollHeight > host.clientHeight && host.clientHeight > 0,
    { timeout: 10000 },
  )
  host.scrollTo({ top: 125.5, behavior: 'instant' })
  await ctx.waitFor(() => host.scrollTop > 0, { timeout: 3000 })
  const before = [host.scrollLeft, host.scrollTop]
  const release = suspendScrollInput(host)
  ctx.onCleanup(release)
  ctx.assert('native suspension applied', host.nativeViewProtected.userScrollEnabled, false)
  ctx.assert('horizontal pose unchanged', host.scrollLeft, before[0])
  ctx.assert('vertical pose unchanged', host.scrollTop, before[1])
  host.scrollTo({ left: 15.25, top: 30.5, behavior: 'instant' })
  await ctx.waitFor(() => Math.abs(host.scrollTop - 30.5) < 1, { timeout: 3000 })
  ctx.assert('programmatic moved while suspended', host.scrollTop > 0, true)
  ctx.record('programmatic while suspended', { left: host.scrollLeft, top: host.scrollTop })
  release()
  ctx.assert('native input resumed', host.nativeViewProtected.userScrollEnabled, true)
}
