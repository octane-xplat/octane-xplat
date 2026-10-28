import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
test('curated UI primitives compile and dispatch through real GTK controllers', async (t) => {
	const outDir = join(fixture, 'dist-ui-primitives')
	await build({
		logLevel: 'error',
		...(await xplatLinuxGtk('production', {
			root: fixture,
			entry: 'src/ui-primitives-main.ts',
			outDir,
		})),
	})
	const bundle = join(outDir, 'app.js')
	assert.doesNotMatch(readFileSync(bundle, 'utf8'), /document\.createElement|window\.document/)
	if (spawnSync('gjs', ['--version']).status !== 0) {
		t.diagnostic('Build evidence only; GJS is unavailable')
		return
	}
	const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
	const hasMason = existsSync(join(nativeDir, 'XplatMason-1.0.typelib'))
	const env = { ...process.env, ...(hasMason ? { XPLAT_MASON_TYPELIB: nativeDir } : {}) }
	if (process.platform === 'darwin')
		env.DYLD_FALLBACK_LIBRARY_PATH = [
			join(execFileSync('brew', ['--prefix'], { encoding: 'utf8' }).trim(), 'lib'),
			env.DYLD_FALLBACK_LIBRARY_PATH,
		]
			.filter(Boolean)
			.join(':')
	const result = spawnSync('gjs', ['-m', bundle], { env, encoding: 'utf8', timeout: 20000 })
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
	const line = result.stdout.split('\n').find((s) => s.startsWith('GTK_UI_PRIMITIVES '))
	assert.ok(line, `Missing primitive result: ${result.stdout}\n${result.stderr}`)
	const { checks, gtk, engine } = JSON.parse(line.slice('GTK_UI_PRIMITIVES '.length))
	assert.ok(
		checks >= (hasMason ? 42 : 37),
		`Expected primitive, update, event and disposal assertions, got ${checks}`,
	)
	t.diagnostic(
		`${process.platform}; GTK ${gtk}; ${checks} assertions; ${engine}; controller-signal dispatch, no OS input or visual evidence`,
	)
}, 120000)
