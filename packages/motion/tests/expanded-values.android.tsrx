// bun run probe run packages/motion/tests/expanded-values.android.tsrx --target android --deps @octane-xplat/motion
import { runExpandedValues } from './expanded-values-contract.mobile.tsrx'
import type { ProbeContext } from '../../../tools/probe/context'

export async function run(ctx: ProbeContext) {
  await runExpandedValues(ctx, (ctx, host, frame) => {
    ctx.assert(`redraw ${frame} retains native host`, Boolean(host.android), true)
  })
}
