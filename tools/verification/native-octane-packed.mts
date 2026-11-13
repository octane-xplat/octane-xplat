import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const folder = process.argv[2]
assert.ok(folder === 'nativescript-octane' || folder === 'vite-octane')
const root = resolve(import.meta.dirname, '../..')
const work = mkdtempSync(join(tmpdir(), 'xplat-native-octane-pack-'))
function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
  assert.equal(result.status, 0, `${command}: ${result.stderr}\n${result.stdout}`)
  return result.stdout
}
try {
  run(
    'bun',
    ['pm', 'pack', '--ignore-scripts', '--destination', work],
    join(root, 'packages', folder),
  )
  const archive = readdirSync(work).find((file) => file.endsWith('.tgz'))
  assert.ok(archive)
  const entries = run('tar', ['-tzf', join(work, archive)], work)
    .trim()
    .split('\n')
  assert.ok(!entries.some((entry) => entry.endsWith('.spec.ts')), 'test sources must not ship')
  run('tar', ['-xzf', join(work, archive)], work)
  const packed = join(work, 'package')
  const manifest = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'))
  assert.equal(manifest.name, `@octane-xplat/${folder}`)
  for (const file of ['LICENSE', 'NOTICE.md', 'README.md']) {
    assert.ok(existsSync(join(packed, file)), file)
  }
  function checkTargets(value: unknown) {
    if (typeof value === 'string' && value.startsWith('./')) {
      assert.ok(existsSync(join(packed, value)), `Missing export ${value}`)
    } else if (value && typeof value === 'object') {
      for (const target of Object.values(value)) {
        checkTargets(target)
      }
    }
  }
  checkTargets(manifest.exports)
  assert.ok(
    !JSON.stringify(manifest).includes('@nativescript-community/'),
    'owned dependency graph',
  )
  if (folder === 'nativescript-octane') {
    const { nativeScriptRenderer } = await import(
      pathToFileURL(join(packed, 'dist/config.js')).href
    )
    assert.equal(nativeScriptRenderer.module, '@octane-xplat/nativescript-octane')
    assert.equal(nativeScriptRenderer.target, 'universal')
    assert.equal(manifest.dependencies?.['@octane-xplat/nativescript-masonkit'], undefined)
    assert.equal(
      manifest.peerDependenciesMeta['@octane-xplat/nativescript-masonkit'].optional,
      true,
    )
  } else {
    assert.equal(manifest.dependencies['@octane-xplat/nativescript-octane'], manifest.version)
    assert.equal(manifest.nativescript.vite.config.from, '@octane-xplat/vite-octane')
  }
  process.stdout.write(`${manifest.name}: packed exports and ownership pass\n`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
