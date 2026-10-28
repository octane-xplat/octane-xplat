import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { setTimeout as delay } from 'node:timers/promises'

assert.equal(process.platform, 'darwin', 'AppKit process profiling requires macOS')
// An initial ceiling for this small silent fixture, not an application budget.
const limitMiB = 384
const command = promisify(execFile)
const child = spawn(
	process.execPath,
	[
		fileURLToPath(new URL('runtime.mjs', import.meta.url)),
		'--foreground-budgets',
		'--target',
		'macos',
	],
	{ stdio: 'inherit' },
)

let running = true
let peakKiB = 0
let samples = 0
const completed = once(child, 'close').finally(() => {
	running = false
})

const observe = (async () => {
	while (running) {
		const { stdout } = await command('ps', ['-axo', 'pid=,ppid=,rss=,command='])
		const processes = stdout.split('\n').flatMap((line) => {
			const match = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/.exec(line)
			return match
				? [
						{
							pid: Number(match[1]),
							parent: Number(match[2]),
							rss: Number(match[3]),
							command: match[4],
						},
					]
				: []
		})

		const descendants = new Set([child.pid])
		let previous = -1
		while (previous !== descendants.size) {
			previous = descendants.size
			for (const process of processes) {
				if (descendants.has(process.parent)) {
					descendants.add(process.pid)
				}
			}
		}

		for (const process of processes) {
			if (
				descendants.has(process.pid) &&
				process.command.includes('/Contents/MacOS/OctaneProbe ') &&
				process.command.includes('NativeScript.framework/Versions/A/NativeScript')
			) {
				peakKiB = Math.max(peakKiB, process.rss)
				samples++
			}
		}

		await delay(200)
	}
})()

try {
	const [[code]] = await Promise.all([completed, observe])
	assert.equal(code, 0, 'Foreground fixture failed')
} finally {
	running = false
	if (child.exitCode === null && child.signalCode === null) {
		child.kill()
	}

	await observe.catch(() => {})
}

assert.ok(samples > 0, 'No owned AppKit host samples were collected')
const peakMiB = peakKiB / 1024
console.log(
	JSON.stringify({
		metric: 'owned AppKit host peak RSS',
		peakMiB,
		limitMiB,
		samples,
		scope:
			'200 ms samples; excludes GPU, other processes and physical output; not a leak or app-startup qualification',
	}),
)

assert.ok(peakMiB <= limitMiB, `Fixture host RSS ${peakMiB} MiB exceeded ${limitMiB} MiB`)
