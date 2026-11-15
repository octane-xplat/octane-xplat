import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gtkRuntimeReady, gtkRuntimeUnavailableReason } from './gjs-availability.mts'

test(
  'GTK portals preserve context, state, range order, host ownership and abort cleanup',
  { timeout: 120000 },
  async (t) => {
    const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
    const outDir = join(fixture, 'dist-ui-portal')

    if (!gtkRuntimeReady()) {
      t.skip(gtkRuntimeUnavailableReason())
      return
    }

    await build({
      logLevel: 'error',
      ...(await linuxGtk('production', {
        root: fixture,
        entry: 'src/ui-portal-main.ts',
        outDir,
      })),
    })

    const result = spawnSync('gjs', ['-m', join(outDir, 'app.js')], {
      encoding: 'utf8',
      timeout: 40000,
      env: { ...process.env },
    })

    assert.equal(result.status, 0, result.stdout + '\n' + result.stderr)
    assert.doesNotMatch(result.stderr, /\[linux-gtk\] event handler failed|Gtk-CRITICAL/)

    const line = result.stdout.split('\n').find((line) => line.startsWith('GTK_PORTAL '))

    assert.ok(line, result.stdout)

    const report = JSON.parse(line.slice('GTK_PORTAL '.length))

    assert.ok(report.checks >= 48, JSON.stringify(report))
    t.diagnostic(
      process.platform +
        '; GTK ' +
        report.gtk +
        '; ' +
        report.checks +
        ' assertions; native widget order and controller dispatch; no OS input or image analysis',
    )
  },
)
