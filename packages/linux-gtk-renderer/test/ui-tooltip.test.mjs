import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'
test(
	'GTK tooltip preserves context, delayed intent, focus, dismissal and native popup lifetime',
	{ timeout: 120000 },
	async (t) => {
		const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
		const outDir = join(fixture, 'dist-ui-tooltip')
		await build({
			logLevel: 'error',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/ui-tooltip-main.ts',
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
		const osInput =
			process.platform === 'linux' &&
			!!process.env.DISPLAY &&
			spawnSync('xdotool', ['version']).status === 0
		const env = {
			...process.env,
			GTK_A11Y: 'test',
			GTK_TOOLTIP_OS: osInput ? '1' : '0',
			XPLAT_MASON_TYPELIB: nativeDir,
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
			if (!line.startsWith('GTK_TOOLTIP_READY ')) return
			try {
				const phase = JSON.parse(line.slice('GTK_TOOLTIP_READY '.length))
				const id = execFileSync(
					'xdotool',
					['search', '--onlyvisible', '--name', '^Octane GTK tooltip test$'],
					{ env, encoding: 'utf8' },
				)
					.trim()
					.split('\n')[0]
				const send = (...args) => execFileSync('xdotool', args, { env, timeout: 7000 })
				send('windowfocus', id)
				if (phase.phase === 'hover')
					send(
						'mousemove',
						'--window',
						id,
						String(Math.round(phase.x)),
						String(Math.round(phase.y)),
					)
				else if (phase.phase === 'leave') send('mousemove', '--window', id, '390', '340')
				else if (phase.phase === 'focus') send('key', 'Tab')
				else if (phase.phase === 'escape') send('key', 'Escape')
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
			if (child.exitCode === null) child.kill()
		})
		const code = await new Promise((resolve, reject) => {
			child.once('error', reject)
			child.once('close', resolve)
		})
		assert.equal(code, 0, stdout + '\n' + stderr + '\n' + (inputError ?? ''))
		assert.doesNotMatch(stderr, /Gtk-CRITICAL|Gjs-CRITICAL|event handler failed/)
		const line = stdout.split('\n').find((line) => line.startsWith('GTK_TOOLTIP '))
		assert.ok(line, stdout)
		const result = JSON.parse(line.slice('GTK_TOOLTIP '.length))
		assert.ok(result.checks >= (osInput ? 50 : 42), JSON.stringify(result))
		assert.equal(result.osInput, osInput)
		t.diagnostic(
			process.platform +
				'; GTK ' +
				result.gtk +
				'; ' +
				result.checks +
				' assertions; actual OS pointer/Tab/Escape: ' +
				osInput +
				'; no images or AT-client proof',
		)
	},
)
