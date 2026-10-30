import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'

/** Build one maintained UI fixture and drive its optional F12 input protocol.
 * Results name the real runtime and distinguish OS input from property checks. */
export async function runGtkUiFixture(t, { stem, title, marker, minChecks, input = true }) {
	const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
	const outDir = join(fixture, 'dist-' + stem)
	await build({
		logLevel: 'error',
		...(await xplatLinuxGtk('production', {
			root: fixture,
			entry: 'src/' + stem + '-main.ts',
			outDir,
		})),
	})
	const bundle = join(outDir, 'app.js')
	assert.doesNotMatch(readFileSync(bundle, 'utf8'), /document\.createElement|window\.document/)
	const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
	const lib = process.platform === 'darwin' ? 'libxplatmason-gtk.dylib' : 'libxplatmason-gtk.so'
	if (
		spawnSync('gjs', ['--version']).status !== 0 ||
		!existsSync(join(nativeDir, 'XplatMason-1.0.typelib')) ||
		!existsSync(join(nativeDir, lib))
	) {
		t.skip('Build passed; GJS and XplatMason artifacts required for runtime')
		return
	}
	const osInput =
		input &&
		process.platform === 'linux' &&
		!!process.env.DISPLAY &&
		spawnSync('xdotool', ['version']).status === 0
	const env = {
		...process.env,
		GTK_A11Y: 'test',
		[marker + '_OS']: osInput ? '1' : '0',
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
	const ready = marker + '_READY '
	lines.on('line', (line) => {
		stdout += line + '\n'
		if (!osInput || !line.startsWith(ready)) {
			return
		}
		try {
			const phase = JSON.parse(line.slice(ready.length))
			const id = execFileSync('xdotool', ['search', '--onlyvisible', '--name', '^' + title + '$'], {
				env,
				encoding: 'utf8',
			})
				.trim()
				.split('\n')[0]
			const send = (...args) => execFileSync('xdotool', args, { env, timeout: 7000 })
			send('windowfocus', id)
			if (phase.type != null) {
				send('type', '--clearmodifiers', '--delay', '35', '--', phase.type)
			} else if (phase.key) {
				send('key', '--clearmodifiers', phase.key)
			} else if (phase.dbl) {
				send('mousemove', '--window', id, String(Math.round(phase.x)), String(Math.round(phase.y)))
				// One xdotool process keeps both presses inside GTK's
				// double-click time; separate invocations land too far apart.
				send('click', '--repeat', '2', '--delay', '60', '1')
			} else if (phase.drag) {
				const x = Math.round(phase.x),
					y = Math.round(phase.y)
				// One xdotool invocation runs the whole sequence — per-process
				// spawn overhead would drop the release velocity below
				// GtkGestureSwipe's threshold.
				const args = ['mousemove', '--window', id, String(x), String(y), 'mousedown', '1']
				for (let step = 1; step <= 10; step++) {
					args.push(
						'mousemove',
						'--window',
						id,
						String(Math.round(x + (Number(phase.drag.dx ?? 0) * step) / 10)),
						String(Math.round(y + (Number(phase.drag.dy ?? 0) * step) / 10)),
						'sleep',
						'0.01',
					)
				}
				args.push('mouseup', '1')
				send(...args)
			} else {
				send('mousemove', '--window', id, String(Math.round(phase.x)), String(Math.round(phase.y)))
				if (phase.hold) {
					send('mousedown', '1')
					send('sleep', String((phase.holdMs ?? 800) / 1000))
					send('mouseup', '1')
				} else if (!phase.hover) {
					send('click', '1')
				}
			}
			send('key', 'F12')
		} catch (error) {
			inputError = error
			child.kill()
		}
	})
	const deadline = setTimeout(() => child.kill(), 60000)
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
	assert.doesNotMatch(stderr, /Gtk-CRITICAL|Gjs-CRITICAL|\[linux-gtk\] event handler failed/)
	const prefix = marker + ' '
	const result = JSON.parse(
		stdout
			.split('\n')
			.find((line) => line.startsWith(prefix))
			?.slice(prefix.length) ?? '{}',
	)
	const minimum =
		typeof minChecks === 'number' ? minChecks : osInput ? minChecks.os : minChecks.properties
	assert.ok(result.checks >= minimum, JSON.stringify(result))
	assert.equal(result.osInput, osInput)
	assert.deepEqual(result.failures, [])
	t.diagnostic(
		process.platform +
			'; GTK ' +
			result.gtk +
			'; ' +
			result.checks +
			' assertions; actual OS keyboard/click: ' +
			osInput +
			'; no images or IME/AT-client proof',
	)
}
