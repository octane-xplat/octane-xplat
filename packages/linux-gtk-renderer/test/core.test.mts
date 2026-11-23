import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'vite'
import { runGtkEvalFixture } from './gjs-ui-fixture.mts'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'

test('GTK on NativeScript Core retains native controls across updates and releases them', async (t) => {
  if (process.env.LINUX_RUNTIME_EVAL_ENGINE) {
    return runGtkEvalFixture(t, {
      stem: 'core', entry: 'src/core-main.gtk.ts', marker: 'GTK_CORE_OK', minChecks: 18,
    })
  }
  const root = fileURLToPath(new URL('./fixtures/', import.meta.url))
  const outDir = await mkdtemp(join(tmpdir(), 'xplat-gtk-core-'))
  t.after(() => rm(outDir, { recursive: true, force: true }))
  await build({
    logLevel: 'error',
    ...(await linuxGtk('development', { root, outDir, entry: 'src/core-main.gtk.ts' })),
  })
  const available =
    process.platform === 'linux' &&
    process.env.DISPLAY &&
    spawnSync('gjs', ['--version']).status === 0
  if (!available) {
    t.diagnostic('Bundle compiled. Run on Linux in an X session to assert GTK runtime behavior.')
    return
  }
  const run = spawnSync('gjs', ['-m', join(outDir, 'app.js')], {
    encoding: 'utf8',
    timeout: 20_000,
    env: { ...process.env, GTK_A11Y: 'none' },
  })
  assert.equal(run.status, 0, run.error?.message ?? run.stderr)
  assert.match(run.stdout, /GTK_CORE_OK/)
  assert.doesNotMatch(run.stderr, /CRITICAL|JS ERROR/)
})
