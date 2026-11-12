import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gjsAvailable, masonTypelibPresent } from './gjs-availability.mts'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))

test('measurement and aspect ratio follow real GTK allocation and scrolling', async (t) => {
  const outDir = join(fixture, 'dist-ui-measure')

  if (!gjsAvailable()) {
    t.skip('gjs is not installed')
    return
  }

  if (!masonTypelibPresent()) {
    t.skip('XplatMason typelib required for runtime')
    return
  }

  await build({
    logLevel: 'error',
    ...(await linuxGtk('production', {
      root: fixture,
      entry: 'src/ui-measure-main.ts',
      outDir,
    })),
  })

  const bundle = join(outDir, 'app.js')

  assert.doesNotMatch(readFileSync(bundle, 'utf8'), /document\.createElement|window\.document/)

  const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
  const hasMason = existsSync(join(nativeDir, 'XplatMason-1.0.typelib'))
  const env = { ...process.env, ...(hasMason ? { XPLAT_MASON_TYPELIB: nativeDir } : {}) }

  if (process.platform === 'darwin') {
    env.DYLD_FALLBACK_LIBRARY_PATH = [
      join(execFileSync('brew', ['--prefix'], { encoding: 'utf8' }).trim(), 'lib'),
      env.DYLD_FALLBACK_LIBRARY_PATH,
    ]
      .filter(Boolean)
      .join(':')
  }

  const result = spawnSync('gjs', ['-m', bundle], { env, encoding: 'utf8', timeout: 20000 })

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const line = result.stdout.split('\n').find((s) => s.startsWith('GTK_UI_MEASURE '))

  assert.ok(line, `Missing primitive result: ${result.stdout}\n${result.stderr}`)

  const { checks, gtk } = JSON.parse(line.slice('GTK_UI_MEASURE '.length))

  assert.ok(checks >= 19, `Expected measurement checks, got ${checks}`)

  t.diagnostic(
    `${process.platform}; GTK ${gtk}; ${checks} assertions; XplatMason; real GTK allocation and scroll adjustment; no OS input or visual evidence`,
  )
}, 120000)
