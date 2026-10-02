import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const host = spawn(process.execPath, ['./scripts/dev.mjs'], {
	cwd: fileURLToPath(new URL('..', import.meta.url)),
	env: {
		...process.env,
		OCTANE_MACOS_AUTOMATION: '1',
		OCTANE_MACOS_PARITY_ONLY: '0',
		OCTANE_MACOS_VLIST_BENCH: '0',
	},
	stdio: ['pipe', 'pipe', 'pipe'],
})

const closed = new Promise((resolve) => host.once('close', resolve))
let timer
try {
	const report = await new Promise((resolve, reject) => {
		timer = setTimeout(() => reject(new Error('AppKit smoke timed out')), 120000)
		host.once('error', reject)
		host.once('close', (code, signal) => {
			reject(new Error(`AppKit host exited before completing smoke (${code ?? signal})`))
		})

		for (const input of [host.stdout, host.stderr]) {
			createInterface({ input }).on('line', (line) => {
				console.log(line)
				if (/uncaught render error|\[sweep\] macOS failed|: FAIL/.test(line)) {
					reject(new Error(line))
				}

				const marker = '[macos-smoke] '
				const at = line.indexOf(marker)
				if (at >= 0) {
					try {
						resolve(JSON.parse(line.slice(at + marker.length)))
					} catch (error) {
						reject(error)
					}
				}
			})
		}
	})

	assert.equal(report.failures, 0)
	// Every existing assertion must run, including conditional demo interactions.
	assert.equal(report.assertions, 30, 'Incomplete AppKit harness sweep')
	console.log('[smoke] AppKit: 30 assertions passed (action dispatch; no OS input claim)')
} finally {
	clearTimeout(timer)
	host.kill('SIGTERM')
	const force = setTimeout(() => host.kill('SIGKILL'), 5000)
	await closed
	clearTimeout(force)
}
