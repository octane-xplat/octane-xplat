import { runGtkEvalFixture } from './gjs-ui-fixture.mjs'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gtkRuntimeReady, gtkRuntimeUnavailableReason } from './gjs-availability.mjs'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))

test('unmounted roots detach their window wiring (#229)', async (t) => {
  if (process.env.LINUX_RUNTIME_EVAL_ENGINE) {
    return runGtkEvalFixture(t, {
      stem: 'root-teardown',
      entry: 'src/root-teardown-main.ts',
      marker: 'GTK_ROOT_TEARDOWN',
      minChecks: 44,
    })
  }

  const outDir = join(fixture, 'dist-root-teardown')

  if (!gtkRuntimeReady()) {
    t.skip(gtkRuntimeUnavailableReason())
    return
  }

  await build({
    logLevel: 'error',
    ...(await linuxGtk('production', {
      root: fixture,
      entry: 'src/root-teardown-main.ts',
      outDir,
    })),
  })

  const env = { ...process.env }

  if (process.platform === 'darwin') {
    env.DYLD_FALLBACK_LIBRARY_PATH = [
      join(execFileSync('brew', ['--prefix'], { encoding: 'utf8' }).trim(), 'lib'),
      env.DYLD_FALLBACK_LIBRARY_PATH,
    ]
      .filter(Boolean)
      .join(':')
  }

  const result = spawnSync('gjs', ['-m', join(outDir, 'app.js')], {
    env,
    encoding: 'utf8',
    timeout: 20000,
  })

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  assert.doesNotMatch(result.stderr, /CRITICAL/)

  const line = result.stdout.split('\n').find((s) => s.startsWith('GTK_ROOT_TEARDOWN '))

  assert.ok(line, `Missing teardown result: ${result.stdout}\n${result.stderr}`)

  const { checks, gtk, engine } = JSON.parse(line.slice('GTK_ROOT_TEARDOWN '.length))

  assert.ok(checks >= 44, `Expected mount/unmount wiring and host assertions, got ${checks}`)

  t.diagnostic(
    `${process.platform}; GTK ${gtk}; ${checks} assertions; ${engine}; five remount cycles + pre-window unwire, no OS input`,
  )
}, 120000)
