import { runGtkEvalFixture } from './gjs-ui-fixture.mts'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gtkRuntimeReady, gtkRuntimeUnavailableReason } from './gjs-availability.mts'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))

test('curated UI primitives compile and dispatch through real GTK controllers', async (t) => {
  if (process.env.LINUX_RUNTIME_EVAL_ENGINE) {
    return runGtkEvalFixture(t, {
      stem: 'ui',
      entry: 'src/ui-primitives-main.ts',
      marker: 'GTK_UI_PRIMITIVES',
      minChecks: 42,
    })
  }

  const outDir = join(fixture, 'dist-ui-primitives')

  if (!gtkRuntimeReady()) {
    t.skip(gtkRuntimeUnavailableReason())
    return
  }

  await build({
    logLevel: 'error',
    ...(await linuxGtk('production', {
      root: fixture,
      entry: 'src/ui-primitives-main.ts',
      outDir,
    })),
  })

  const bundle = join(outDir, 'app.js')

  assert.doesNotMatch(readFileSync(bundle, 'utf8'), /document\.createElement|window\.document/)

  const env = { ...process.env }

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

  const line = result.stdout.split('\n').find((s) => s.startsWith('GTK_UI_PRIMITIVES '))

  assert.ok(line, `Missing primitive result: ${result.stdout}\n${result.stderr}`)

  const { checks, gtk, engine } = JSON.parse(line.slice('GTK_UI_PRIMITIVES '.length))

  assert.ok(
    checks >= 42,
    `Expected primitive, update, event and disposal assertions, got ${checks}`,
  )

  t.diagnostic(
    `${process.platform}; GTK ${gtk}; ${checks} assertions; ${engine}; controller-signal dispatch, no OS input or visual evidence`,
  )
}, 120000)
