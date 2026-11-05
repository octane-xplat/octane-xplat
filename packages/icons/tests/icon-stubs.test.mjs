import { loadSource } from '../../../scripts/load-source.ts'
import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { discoverIconifyCollections, syncIconStubs } = await loadSource(
  new URL('../src/vite/stubs.ts', import.meta.url),
)

const root = mkdtempSync(join(tmpdir(), 'xplat-icons-stubs-'))
mkdirSync(join(root, 'node_modules/@iconify-json/mini'), { recursive: true })
writeFileSync(
  join(root, 'node_modules/@iconify-json/mini/icons.json'),
  JSON.stringify({
    prefix: 'mini',
    icons: { wide: { body: '<path d="M0 0h32v16H0z"/>' } },
    aliases: { turned: { parent: 'wide', rotate: 1 } },
  }),
)

test('discoverIconifyCollections finds installed collection JSON', () => {
  const found = discoverIconifyCollections(join(root, 'src/deep'))
  assert.equal(found.get('mini'), join(root, 'node_modules/@iconify-json/mini/icons.json'))
})

test('syncIconStubs writes one stub per icon and alias, and prunes', () => {
  const first = syncIconStubs({ root })
  assert.deepEqual(first.collections, ['mini'])
  assert.equal(first.written, 2)
  assert.equal(first.missing.length, 0)
  const stub = join(root, '.icons/mini/wide.icon')
  const alias = join(root, '.icons/mini/turned.icon')
  assert.equal(readFileSync(stub, 'utf8'), 'icons:mini/wide\n')
  assert.equal(readFileSync(alias, 'utf8'), 'icons:mini/turned\n')

  // Idempotent: nothing to write when the tree is current.
  assert.equal(syncIconStubs({ root }).written, 0)

  // Stale files and removed collections are pruned.
  writeFileSync(join(root, '.icons/mini/gone.icon'), 'icons:mini/gone\n')
  mkdirSync(join(root, '.icons/other'), { recursive: true })
  writeFileSync(join(root, '.icons/other/x.icon'), 'icons:other/x\n')
  const second = syncIconStubs({ root })
  assert.equal(second.removed, 2)
  assert.ok(!existsSync(join(root, '.icons/mini/gone.icon')))
  assert.ok(!existsSync(join(root, '.icons/other')))
})

test('syncIconStubs honors an explicit collection list', () => {
  const outDir = join(root, 'custom')
  const result = syncIconStubs({ root, outDir, collections: ['mini', 'absent'] })
  assert.deepEqual(result.missing, ['absent'])
  assert.ok(existsSync(join(outDir, 'mini/wide.icon')))
})

after(() => rmSync(root, { recursive: true, force: true }))
