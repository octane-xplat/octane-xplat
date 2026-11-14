/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './content-flow.css'
import { Pager } from '@octane-xplat/pager'
import { View, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../tools/probe/context'

const items = [0]
const page = () => (
  <>
    <View id="pager-first" className="pager-flow-child" flexGrow={1} />
    <View id="pager-second" className="pager-flow-child" flexGrow={1} />
  </>
)

export default function Example() {
  return (
    <VStack width={320} height={240}>
      <Pager id="pager-flow-viewport" className="pager-flow-host" items={items} renderItem={page} />
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  await ctx.waitFor(
    () => {
      ctx.record('pager viewport', ctx.inspect('pager-flow-viewport'))
      return ctx.find('pager-second') && (ctx.inspect('pager-second').frame?.width ?? 0) > 0
    },
    { timeout: 10000 },
  )

  const first = ctx.inspect('pager-first').frame!
  const second = ctx.inspect('pager-second').frame!
  const advance = ctx.target === 'macos' ? first.y - second.y : second.y - first.y

  ctx.record('page content', { first, second })
  ctx.assert('page content fills width', Math.abs(first.width - 240) <= 1)
  ctx.assert('page content ignores flex growth', Math.abs(first.height - 20) <= 1)
  ctx.assert('page content flows vertically', Math.abs(advance - 20) <= 1)
  ctx.assert('page content shares left edge', Math.abs(first.x - second.x) <= 1)
}
