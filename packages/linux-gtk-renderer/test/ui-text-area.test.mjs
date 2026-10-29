import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'
const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
test(
	'GTK TextArea sizes native rows, overlays hints and scrolls capped content with actual OS input',
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
		const osInput =
			process.platform === 'linux' &&
			!!process.env.DISPLAY &&
			spawnSync('xdotool', ['version']).status === 0
		const env = {
			...process.env,
			GTK_A11Y: 'test',
			GTK_TEXT_OS: osInput ? '1' : '0',
			XPLAT_MASON_TYPELIB: nativeDir,
		}
		const child = spawn('gjs', ['-m', bundle], { env, stdio: ['ignore', 'pipe', 'pipe'] })
		let stdout = '',
			stderr = '',
			inputError
		child.stderr.on('data', (data) => {
			stderr += data
		})
		const lines = createInterface({ input: child.stdout })
		lines.on('line', (line) => {
			stdout += line + '\n'
			if (!line.startsWith('GTK_TEXT_AREA_READY ')) return
			try {
				const phase = JSON.parse(line.slice('GTK_TEXT_AREA_READY '.length))
				const id = execFileSync(
					'xdotool',
					['search', '--onlyvisible', '--name', '^Octane GTK text area test$'],
					{ env, encoding: 'utf8' },
				)
					.trim()
					.split('\n')[0]
				const send = (...args) => {
					try {
						execFileSync('xdotool', args, { env, timeout: 7000 })
					} catch (error) {
						throw new Error('xdotool ' + args.join(' ') + ': ' + error.message)
					}
				}
				send('windowfocus', id)
				if (phase.phase === 'return') {
					send('key', '--clearmodifiers', 'Return')
				} else if (phase.phase === 'end' || phase.phase === 'home') {
					send('key', '--clearmodifiers', phase.phase === 'end' ? 'ctrl+End' : 'ctrl+Home')
				} else if (phase.phase.startsWith('type-')) {
					send('type', '--clearmodifiers', '--delay', '35', phase.phase.slice(5))
				} else {
					send(
						'mousemove',
						'--window',
						id,
						String(Math.round(phase.x)),
						String(Math.round(phase.y)),
					)
					send(
						'click',
						'--repeat',
						String(phase.repeat ?? 6),
						'--delay',
						'35',
						phase.phase.endsWith('-click') ? '1' : phase.phase.endsWith('down') ? '5' : '4',
					)
				}
				send('key', 'F12')
			} catch (error) {
				inputError = error
				child.kill()
			}
		})
		const deadline = setTimeout(() => child.kill(), 75000)
		t.after(() => {
			clearTimeout(deadline)
			lines.close()
			if (child.exitCode === null) child.kill()
		})
		const code = await new Promise((resolve, reject) => {
			child.once('error', reject)
			child.once('close', resolve)
		})
		assert.equal(code, 0, stdout + '\n' + stderr + '\n' + (inputError ?? ''))
		assert.doesNotMatch(stderr, /\[linux-gtk\] event handler failed|Gtk-CRITICAL|Gjs-CRITICAL/)

		const line = stdout.split('\n').find((line) => line.startsWith('GTK_TEXT_AREA '))
		assert.ok(line, stdout)
		const result = JSON.parse(line.slice('GTK_TEXT_AREA '.length))
		assert.ok(result.checks >= (osInput ? 260 : 209), JSON.stringify(result))
		assert.equal(result.osInput, osInput)
		t.diagnostic(
			process.platform +
				'; GTK ' +
				result.gtk +
				'; ' +
				result.checks +
				' assertions; actual OS keyboard/wheel: ' +
				osInput +
				'; no images or IME/AT-client qualification',
		)
	},
)
