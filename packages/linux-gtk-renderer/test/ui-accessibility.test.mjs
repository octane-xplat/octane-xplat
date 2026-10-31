import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'
test(
	'GTK accessibility states and shared field flags reach native metadata and reset correctly',
	{ timeout: 120000 },
	async (t) => {
		const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
		const outDir = join(fixture, 'dist-ui-accessibility')
		await build({
			logLevel: 'error',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/ui-accessibility-main.ts',
				outDir,
			})),
		})
		const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
		if (
			spawnSync('gjs', ['--version']).status !== 0 ||
			!existsSync(join(nativeDir, 'XplatMason-1.0.typelib'))
		) {
			t.skip('Build passed; GJS and XplatMason required for runtime')
			return
		}
		const result = spawnSync('gjs', ['-m', join(outDir, 'app.js')], {
			encoding: 'utf8',
			timeout: 40000,
			env: { ...process.env, XPLAT_MASON_TYPELIB: nativeDir, GTK_A11Y: 'test' },
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
