/** @jsxImportSource @octane-xplat/jsx */
import BlockFlow, { run as blockFlow } from './block-flow.tsrx'
import { run as neutralContainers } from './neutral-containers.tsrx'
import { run as contentFlow } from './content-flow.tsrx'
import { run as buttonLoading } from './button-loading.tsrx'
import { run as page } from './page.tsrx'
import type { ProbeContext } from '../../../../../tools/probe/context'

// One app identity keeps device qualification to one native build. Each case
// mounts its own tree; the standalone fixtures remain useful for diagnosis.
export default BlockFlow

export async function run(ctx: ProbeContext) {
  await blockFlow(ctx)
  await neutralContainers(ctx)
  await contentFlow(ctx)
  await page(ctx)
  if (ctx.target === 'ios') {
    await buttonLoading(ctx)
  }
}
