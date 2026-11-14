/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './native-slots.css'
import { View, VStack } from '@octane-xplat/ui'
import { ShaderSurface } from './native-surfaces.tsrx'
import { slots } from './native-slot-content.mobile.tsrx'
import { checkNativeSlot } from './native-slot-check.mobile'
import type { ProbeContext } from '../../probe/context'

// This remains a separate registered-shader regression for issue #274.
// An unregistered effect's unfiltered fallback cannot satisfy this case.
export default function Example() {
  return (
    <VStack id="native-surfaces-root">
      <ShaderSurface />
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  await checkNativeSlot(ctx, 'effect')
  await ctx.mount(View)
  await ctx.waitFor(
    () => {
      const entry = slots.get('effect')

      return !entry?.first && !entry?.second
    },
    { timeout: 5000 },
  )

  const entry = slots.get('effect')

  ctx.assert('shader content refs detach on unmount', !entry?.first && !entry?.second)
}
