import assert from 'node:assert/strict'
import { spawnSync, spawn, execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createServer } from 'node:http'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
test(
	'GTK icons decode SVG sources and preserve scoped registries, tint and async ownership',
	{ timeout: 120000 },
	async (t) => {
		const outDir = join(fixture, 'dist-ui-icon')
		await build({
			logLevel: 'error',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/ui-icon-main.ts',
				outDir,
			})),
		})
		const bundle = join(outDir, 'app.js')
		assert.doesNotMatch(readFileSync(bundle, 'utf8'), /document\\.createElement|window\\.document/)
		const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
		if (
			spawnSync('gjs', ['--version']).status !== 0 ||
			!existsSync(join(nativeDir, 'XplatMason-1.0.typelib'))
		) {
			t.skip('Build passed; runtime requires GJS and XplatMason')
			return
		}
		const svg =
			'<svg xmlns="http://www.w3.org/2000/svg" width="13" height="9"><path d="M0 0h13v9H0z"/></svg>'
		writeFileSync(join(outDir, 'fixture-icon.svg'), svg)
		writeFileSync(
			join(outDir, 'fixture-resources.xml'),
			'<gresources><gresource prefix="/icons"><file>fixture-icon.svg</file></gresource></gresources>',
		)
		execFileSync('glib-compile-resources', [
			'--sourcedir=' + outDir,
			'--target=' + join(outDir, 'fixture.gresource'),
			join(outDir, 'fixture-resources.xml'),
		])
		const server = createServer((req, res) => {
			const respond = () => {
				res.writeHead(req.url.endsWith('/missing.svg') ? 404 : 200, {
					'content-type': 'image/svg+xml',
				})
				res.end(svg)
			}
			if (req.url.endsWith('/slow.svg')) {
				setTimeout(respond, 200)
			} else {
				respond()
			}
		})
		await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
		t.after(() => server.close())
		const env = {
			...process.env,
			GTK_A11Y: 'test',
			GTK_ICON_FILE: join(outDir, 'fixture-icon.svg'),
			GTK_ICON_RESOURCE: join(outDir, 'fixture.gresource'),
			XPLAT_MASON_TYPELIB: nativeDir,
			GTK_ICON_HTTP: 'http://127.0.0.1:' + server.address().port,
		}
		const child = spawn('gjs', ['-m', bundle], { env, stdio: ['ignore', 'pipe', 'pipe'] })
		let stdout = '',
			stderr = ''
		child.stdout.on('data', (data) => {
			stdout += data
		})
		child.stderr.on('data', (data) => {
			stderr += data
		})
		const deadline = setTimeout(() => child.kill(), 30000)
		t.after(() => {
			clearTimeout(deadline)
			if (child.exitCode === null) {
				child.kill()
			}
		})
		const code = await new Promise((resolve, reject) => {
			child.once('error', reject)
			child.once('close', resolve)
		})
		assert.equal(code, 0, stdout + '\n' + stderr)
		const line = stdout.split('\n').find((line) => line.startsWith('GTK_UI_ICON '))
		assert.ok(line, stdout)
		const result = JSON.parse(line.slice('GTK_UI_ICON '.length))
		assert.ok(result.checks >= 44, JSON.stringify(result))
		t.diagnostic(
			process.platform +
				'; GTK ' +
				result.gtk +
				'; ' +
				result.checks +
				' state/dimension/lifecycle assertions; no screenshots, pixel inspection, OS input or AT-client evidence',
		)
	},
)
