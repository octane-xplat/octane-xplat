import * as block from '../../../packages/ui/tests/fixtures/page-layout/block-flow.tsrx'
import * as neutral from '../../../packages/ui/tests/fixtures/page-layout/neutral-containers.tsrx'
import * as content from '../../../packages/ui/tests/fixtures/page-layout/content-flow.tsrx'
import * as page from '../../../packages/ui/tests/fixtures/page-layout/page.tsrx'
import { runDesktopSuite } from './desktop-runtime.mjs'

export async function runDesktopCases(adapter, target, emit) {
  let pass = true
  for (const [name, fixture] of Object.entries({ block, neutral, content, page })) {
    const result = await runDesktopSuite(fixture, adapter, target, (result) =>
      emit({ ...result, case: name }),
    )
    pass &&= result.status === 'pass'
  }
  return pass
}
