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
	'GTK multiline buffers preserve Unicode selection, editability, focus, Return behavior and retired listeners',
	{ timeout: 120000 },
	async (t) => {
		const outDir = join(fixture, 'dist-ui-text-view')
		await build({
			logLevel: 'error',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/ui-text-view-main.ts',
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
			if (!line.startsWith('GTK_TEXT_VIEW_READY ')) return
			try {
				const phase = JSON.parse(line.slice('GTK_TEXT_VIEW_READY '.length))
				const id = execFileSync(
					'xdotool',
					['search', '--onlyvisible', '--name', '^Octane GTK multiline test$'],
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
				if (phase.text) send('type', '--clearmodifiers', '--delay', '30', phase.text)
				if (phase.key) send('key', '--clearmodifiers', phase.key)
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
			if (child.exitCode === null) child.kill()
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
		assert.doesNotMatch(stderr, /ignored prop|event handler failed/)
		const line = stdout.split('\n').find((line) => line.startsWith('GTK_TEXT_VIEW '))
		assert.ok(line, stdout)
		const result = JSON.parse(line.slice('GTK_TEXT_VIEW '.length))
		assert.ok(result.checks >= (osKeyboard ? 65 : 35), JSON.stringify(result))
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
