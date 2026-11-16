import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { runGtkEvalFixture } from './gjs-ui-fixture.mts'
import { gtkRuntimeReady, gtkRuntimeUnavailableReason } from './gjs-availability.mts'

test(
  'GTK accessibility states and shared field flags reach native metadata and reset correctly',
  { timeout: 120000 },
  async (t) => {
    if (process.env.LINUX_RUNTIME_EVAL_ENGINE) {
      await runGtkEvalFixture(t, {
        stem: 'ui-accessibility',
        title: 'Octane GTK Accessibility test',
        marker: 'GTK_ACCESSIBILITY',
        minChecks: 58,
        input: false,
      })
      return
    }

    const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
    const outDir = join(fixture, 'dist-ui-accessibility')

    if (!gtkRuntimeReady()) {
      t.skip(gtkRuntimeUnavailableReason())
      return
    }

    await build({
      logLevel: 'error',
      ...(await linuxGtk('production', {
        root: fixture,
        entry: 'src/ui-accessibility-main.ts',
        outDir,
      })),
    })

    const result = spawnSync('gjs', ['-m', join(outDir, 'app.js')], {
      encoding: 'utf8',
      timeout: 40000,
      env: { ...process.env, GTK_A11Y: 'test' },
    })

    assert.equal(result.status, 0, result.stdout + '\n' + result.stderr)
    assert.doesNotMatch(result.stderr, /\[linux-gtk\] event handler failed|Gtk-CRITICAL/)

    const line = result.stdout.split('\n').find((line) => line.startsWith('GTK_ACCESSIBILITY '))

    assert.ok(line, result.stdout)

    const report = JSON.parse(line.slice('GTK_ACCESSIBILITY '.length))

    assert.ok(report.checks >= 58, JSON.stringify(report))
    t.diagnostic(
      process.platform +
        '; GTK ' +
        report.gtk +
        '; ' +
        report.checks +
        ' assertions; native typed GTK state/property comparison; no OS input, AT-client or image proof',
    )
  },
)
