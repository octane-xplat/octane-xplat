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
	'GTK related-field groups and custom field hooks retain native ownership and defaults',
	{ timeout: 90000 },
	async (t) => {
		const outDir = join(fixture, 'dist-ui-field-group')
		await build({
			logLevel: 'error',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/ui-field-group-main.ts',
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
			t.skip('Build passed; GJS/XplatMason required for runtime')
			return
		}
		const result = spawnSync('gjs', ['-m', bundle], {
			env: { ...process.env, GTK_A11Y: 'test', XPLAT_MASON_TYPELIB: nativeDir },
			encoding: 'utf8',
			timeout: 45000,
		})
		assert.equal(result.status, 0, result.stdout + '\n' + result.stderr)
		assert.doesNotMatch(
			result.stderr,
			/Gjs-CRITICAL|Gtk-CRITICAL|effect.*failed|\[linux-gtk\] event handler failed/,
		)
		const line = result.stdout.split('\n').find((s) => s.startsWith('GTK_FIELD_GROUP '))
		assert.ok(line, result.stdout)
		const info = JSON.parse(line.slice('GTK_FIELD_GROUP '.length))
		assert.ok(info.checks >= 25, JSON.stringify(info))
		t.diagnostic(
			process.platform +
				'; GTK ' +
				info.gtk +
				'; ' +
				info.checks +
				' native geometry/context/lifecycle assertions; no OS input, images, IME or AT-client proof',
		)
	},
)
