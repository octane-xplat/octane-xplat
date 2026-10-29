import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'
for (const fallback of [false, true]) {
	test(
		'GTK radio lists preserve fields and grouped keyboard navigation (' +
			(fallback ? 'Gtk.Box' : 'Mason') +
			')',
		{ timeout: 120000 },
		async (t) => {
			const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
			const outDir = join(fixture, 'dist-ui-radio-list')
			await build({
				logLevel: 'error',
				...(await xplatLinuxGtk('production', {
					root: fixture,
					entry: 'src/ui-radio-list-main.ts',
					outDir,
				})),
			})
			const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
			if (
				spawnSync('gjs', ['--version']).status !== 0 ||
				(!fallback && !existsSync(join(nativeDir, 'XplatMason-1.0.typelib')))
			) {
				t.skip('Build passed; GJS required, plus XplatMason for Mason mode')
				return
			}
			const osInput =
				process.platform === 'linux' &&
				!!process.env.DISPLAY &&
				spawnSync('xdotool', ['version']).status === 0
			const env = {
				...process.env,
				GTK_A11Y: 'test',
				GTK_RADIO_OS: osInput ? '1' : '0',
				XPLAT_MASON_TYPELIB: fallback ? undefined : nativeDir,
				GTK_RADIO_FALLBACK: fallback ? '1' : '0',
			}
			if (fallback) {
				if (env.GI_TYPELIB_PATH) {
					env.GI_TYPELIB_PATH = env.GI_TYPELIB_PATH.split(':')
						.filter((path) => path !== nativeDir)
						.join(':')
				}
				const installed = spawnSync(
					'gjs',
					[
						'-c',
						'try { imports.gi.XplatMason; imports.system.exit(0) } catch (_) { imports.system.exit(1) }',
					],
					{ env },
				)
				if (installed.status === 0) {
					t.skip(
						'System Mason is available; an unavailable-Mason environment is required for fallback proof',
					)
					return
				}
			}
			const child = spawn('gjs', ['-m', join(outDir, 'app.js')], {
				env,
				stdio: ['ignore', 'pipe', 'pipe'],
			})
			let stdout = '',
				stderr = '',
				inputError
			child.stderr.on('data', (data) => {
				stderr += data
			})
			const lines = createInterface({ input: child.stdout })
			lines.on('line', (line) => {
				stdout += line + '\n'
				if (!line.startsWith('GTK_RADIO_READY ')) {
					return
				}
				try {
					const phase = JSON.parse(line.slice('GTK_RADIO_READY '.length))
					const id = execFileSync(
						'xdotool',
						['search', '--onlyvisible', '--name', '^Octane GTK radio test$'],
						{ env, encoding: 'utf8' },
					)
						.trim()
						.split('\n')[0]
					const send = (...args) => execFileSync('xdotool', args, { env, timeout: 7000 })
					send('windowfocus', id)
					if (phase.point) {
						send('mousemove', '--window', id, String(phase.point.x), String(phase.point.y))
						send('click', '1')
					} else {
						send('key', phase.key)
					}
					send('key', 'F12')
				} catch (error) {
					inputError = error
					child.kill()
				}
			})
			const timer = setTimeout(() => child.kill(), 45000)
			t.after(() => {
				clearTimeout(timer)
				lines.close()
				if (child.exitCode === null) {
					child.kill()
				}
			})
			const code = await new Promise((resolve, reject) => {
				child.once('error', reject)
				child.once('close', resolve)
			})
			assert.equal(code, 0, stdout + '\n' + stderr + '\n' + (inputError ?? ''))
			assert.doesNotMatch(stderr, /Gtk-CRITICAL|Gjs-(?:Console-)?CRITICAL|event handler failed/)
			const line = stdout.split('\n').find((line) => line.startsWith('GTK_RADIO '))
			assert.ok(line, stdout)
			const result = JSON.parse(line.slice('GTK_RADIO '.length))
			assert.ok(
				result.checks >= (osInput ? (fallback ? 55 : 100) : fallback ? 18 : 50),
				JSON.stringify(result),
			)
			assert.equal(result.osInput, osInput)
			assert.equal(result.fallback, fallback)
			t.diagnostic(
				process.platform +
					'; GTK ' +
					result.gtk +
					'; ' +
					result.checks +
					' assertions; ' +
					(fallback
						? 'Gtk.Box; no typed native-value comparisons'
						: 'Mason; typed native-value comparisons') +
					'; actual OS radio keys: ' +
					osInput +
					'; no images or AT-client proof',
			)
		},
	)
}
