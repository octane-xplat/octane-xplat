import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'
const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
test(
	'GTK TextArea uses native font rows, fixed and bounded growth, and resets size constraints',
	{ timeout: 120000 },
	async (t) => {
		const outDir = join(fixture, 'dist-ui-text-area')
		await build({
			logLevel: 'error',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/ui-text-area-main.ts',
				outDir,
			})),
		})
		const bundle = join(outDir, 'app.js')
		assert.doesNotMatch(readFileSync(bundle, 'utf8'), /document\.createElement|window\.document/)
		const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
		if (
			spawnSync('gjs', ['--version']).status !== 0 ||
			!existsSync(join(nativeDir, 'XplatMason-1.0.typelib'))
		) {
			t.skip('Build passed; GJS and XplatMason required for runtime')
			return
		}
		const result = spawnSync('gjs', ['-m', bundle], {
			env: { ...process.env, GTK_A11Y: 'test', XPLAT_MASON_TYPELIB: nativeDir },
			encoding: 'utf8',
			timeout: 30000,
		})
		assert.equal(result.status, 0, result.stdout + '\n' + result.stderr)
		assert.doesNotMatch(result.stderr, /Gtk-CRITICAL|Gjs-CRITICAL|event handler failed/)
		const line = result.stdout.split('\n').find((line) => line.startsWith('GTK_TEXT_AREA '))
		assert.ok(line, result.stdout)
		const summary = JSON.parse(line.slice('GTK_TEXT_AREA '.length))
		assert.ok(summary.checks >= 24, JSON.stringify(summary))
		t.diagnostic(
			process.platform +
				'; GTK ' +
				summary.gtk +
				'; ' +
				summary.checks +
				' assertions; native geometry; no OS input or image evidence',
		)
	},
)
