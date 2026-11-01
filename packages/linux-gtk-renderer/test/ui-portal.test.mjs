import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gjsAvailable, masonTypelibPresent } from './gjs-availability.mjs'
test(
	'GTK portals preserve context, state, range order, host ownership and abort cleanup',
	{ timeout: 120000 },
	async (t) => {
		const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
		const outDir = join(fixture, 'dist-ui-portal')
		if (!gjsAvailable() || !masonTypelibPresent()) {
			t.skip('GJS and XplatMason required for runtime')
			return
		}
		await build({
			logLevel: 'error',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/ui-portal-main.ts',
				outDir,
			})),
		})
		const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
		const result = spawnSync('gjs', ['-m', join(outDir, 'app.js')], {
			encoding: 'utf8',
			timeout: 40000,
			env: { ...process.env, XPLAT_MASON_TYPELIB: nativeDir },
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
