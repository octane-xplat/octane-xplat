import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { runRendererFixture } from '../renderer-fixture-core.mjs'

test('GTK remounts release renderer-owned native objects and signals', async () => {
  await runRendererFixture({
    engine: 'native',
    stem: 'lifetime',
    title: 'GTK runtime lifetime',
    marker: 'GTK_LIFETIME',
    root: fileURLToPath(new URL('..', import.meta.url)),
    entry: 'fixtures/main.mjs',
    checks: 20,
  })
})
