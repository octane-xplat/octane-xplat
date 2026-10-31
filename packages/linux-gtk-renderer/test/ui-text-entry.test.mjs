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
	'native text refs preserve Unicode selection, focus, readonly state and real keyboard edits on GTK',
	{ timeout: 120000 },
	async (t) => {
		const outDir = join(fixture, 'dist-ui-text-entry')
		await build({
			logLevel: 'error',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/ui-text-entry-main.ts',
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
			t.skip('Build passed; GJS and XplatMason required for runtime')
			return
		}
		const osKeyboard =
			process.platform === 'linux' &&
			!!process.env.DISPLAY &&
			spawnSync('xdotool', ['version']).status === 0
		const env = {
			...process.env,
			GTK_A11Y: 'test',
			GTK_TEXT_OS: osKeyboard ? '1' : '0',
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
			if (!line.startsWith('GTK_TEXT_ENTRY_READY ')) {
				return
			}
			try {
				const phase = JSON.parse(line.slice('GTK_TEXT_ENTRY_READY '.length))
				const id = execFileSync(
					'xdotool',
					['search', '--onlyvisible', '--name', '^Octane GTK text entry test$'],
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
				if (phase.phase === 'controlled-middle') {
					send('type', '--clearmodifiers', '--delay', '30', 'X')
					send('key', 'F12')
					return
				}
				if (phase.phase === 'cursor') {
					send('key', 'Left')
					send('key', 'F12')
					return
				}
				send(
					'windowfocus',
					id,
					'mousemove',
					'--window',
					id,
					String(Math.round(phase.x)),
					String(Math.round(phase.y)),
					'click',
					'1',
				)
				send('key', '--clearmodifiers', 'ctrl+a')
				send(
					'type',
					'--clearmodifiers',
					'--delay',
					'30',
					phase.phase === 'edit'
						? 'Typed'
						: phase.phase === 'controlled-reject'
							? '12x'
							: phase.phase === 'controlled-accept'
								? 'Accepted'
								: 'BLOCKED',
				)
				send('key', 'Return')
				send('key', 'F12')
			} catch (error) {
				inputError = error
				child.kill()
			}
		})
		const deadline = setTimeout(() => child.kill(), 40000)
		t.after(() => {
			clearTimeout(deadline)
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
		assert.doesNotMatch(stderr, /\[linux-gtk\] event handler failed|Gtk-CRITICAL|Gjs-CRITICAL/)
		assert.equal(
			(stderr.match(/returnKeyType captions are unavailable on GTK/g) ?? []).length,
			1,
			stderr,
		)
		assert.doesNotMatch(stderr, /ignored prop returnKeyType/)
		const line = stdout.split('\n').find((line) => line.startsWith('GTK_TEXT_ENTRY '))
		assert.ok(line, stdout)
		const result = JSON.parse(line.slice('GTK_TEXT_ENTRY '.length))
		assert.ok(result.checks >= (osKeyboard ? 92 : 75), JSON.stringify(result))
		assert.equal(result.osKeyboard, osKeyboard)
		t.diagnostic(
			process.platform +
				'; GTK ' +
				result.gtk +
				'; ' +
				result.checks +
				' assertions; actual OS keyboard: ' +
				osKeyboard +
				'; no images or IME/AT-client qualification',
		)
	},
)
