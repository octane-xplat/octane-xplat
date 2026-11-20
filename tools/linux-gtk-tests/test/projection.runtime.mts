import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { runRendererFixture } from '../renderer-fixture-core.mjs'

test('GTK projection preserves native values and ownership', async () => {
  await runRendererFixture({
    engine: 'native',
    stem: 'projection',
    title: 'GTK projection',
    marker: 'GTK_PROJECTION',
    entry: fileURLToPath(new URL('../fixtures/projection-smoke.mjs', import.meta.url)),
    input: false,
    checks: 29,
  })
})
