import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const target = process.argv[2]
if (target !== 'ios' && target !== 'android') {
	throw new Error('Usage: node scripts/bench-virtual-list.mjs <ios|android>')
}

const nativeDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const modeFiles = [
	path.resolve(nativeDir, '../../packages/app/src/platform/virtual-list-benchmark-mode.mobile.ts'),
	path.resolve(nativeDir, '../../packages/app/src/platform/virtual-list-benchmark-mode.native.ts'),
]

const originalModes = modeFiles.map((modeFile) => readFileSync(modeFile, 'utf8'))
const disabledMode =
	[
		'export const VIRTUAL_LIST_BENCH_MODE = false',
		'export const VIRTUAL_LIST_INPUT_MODE = false',
		'export const VIRTUAL_LIST_BENCH_FIXED_MODE = false',
		'export const VIRTUAL_LIST_BENCH_DEMO_MODE = false',
		'export const VIRTUAL_LIST_INPUT_DURATION_MS = 20_000',
	].join('\n') + '\n'

const enabledMode = disabledMode.replace(
	'export const VIRTUAL_LIST_BENCH_MODE = false',
	'export const VIRTUAL_LIST_BENCH_MODE = true',
)

if (originalModes.some((mode) => mode !== disabledMode)) {
	throw new Error(
		`Unexpected benchmark mode source in ${modeFiles.join(', ')}; refusing to overwrite it`,
	)
}

for (const modeFile of modeFiles) {
	writeFileSync(modeFile, enabledMode)
}

let modeRestored = false
const restoreMode = () => {
	if (modeRestored) {return}
	modeFiles.forEach((modeFile, index) => {
		writeFileSync(modeFile, originalModes[index])
	})

	modeRestored = true
}

process.once('exit', restoreMode)

const deviceId = process.env.XPLAT_VLIST_DEVICE
if (!deviceId) {throw new Error('Set XPLAT_VLIST_DEVICE')}
const child = spawn(
	'python3',
	[
		path.resolve(nativeDir, '../../scripts/with-native-target-lock.py'),
		target,
		'node',
		path.resolve(nativeDir, 'scripts/launch-virtual-list-bench.mjs'),
		target,
		deviceId,
	],
	{
		cwd: nativeDir,
		env: process.env,
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: process.platform !== 'win32',
	},
)

let partialLine = ''
let result = null
let outputTail = ''
const marker = '[vlist-benchmark] result '
const errorMarker = '[vlist-benchmark] error '
let forceStop
let benchmarkError = ''
const signalRun = (signal) => {
	if (!child.pid) {return}
	try {
		if (process.platform === 'win32') {child.kill(signal)}
		else {process.kill(-child.pid, signal)}
	} catch {}
}

const stopRun = () => {
	if (result || benchmarkError) {
		const appId = process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat.vlistbench'
		try {
			if (target === 'ios') {
				execFileSync('xcrun', ['simctl', 'terminate', deviceId, appId], { timeout: 8000, stdio: 'ignore' })
			} else {
				execFileSync('adb', ['-s', deviceId, 'shell', 'am', 'force-stop', appId], { timeout: 8000, stdio: 'ignore' })
			}
		} catch {}
	}

	signalRun('SIGINT')
	forceStop = setTimeout(() => signalRun('SIGTERM'), 5000)
	forceStop.unref()
}

process.once('SIGINT', () => {
	restoreMode()
	stopRun()
})

process.once('SIGTERM', () => {
	restoreMode()
	stopRun()
})

const timeout = setTimeout(() => {
	stopRun()
}, 15 * 60_000)

const consume = (chunk) => {
	const text = String(chunk)
	process.stderr.write(text)
	outputTail = (outputTail + text).slice(-12_000)
	partialLine += text
	const lines = partialLine.split(/\r?\n/)
	partialLine = lines.pop() ?? ''
	for (const line of lines) {
		const errorAt = line.indexOf(errorMarker)
		if (errorAt !== -1) {
			benchmarkError = line.slice(errorAt + errorMarker.length)
			clearTimeout(timeout)
			stopRun()
			continue
		}

		const at = line.indexOf(marker)
		if (at === -1) {continue}
		try {
			result = JSON.parse(line.slice(at + marker.length))
			clearTimeout(timeout)
			stopRun()
		} catch (error) {
			process.stderr.write(`\nCould not parse benchmark JSON: ${error}\n`)
		}
	}
}

child.stdout.on('data', consume)
child.stderr.on('data', consume)
child.on('error', (error) => {
	restoreMode()
	clearTimeout(timeout)
	clearTimeout(forceStop)
	process.stderr.write(`${error.stack ?? error}\n`)
	process.exitCode = 1
})

child.on('close', (code, signal) => {
	restoreMode()
	clearTimeout(timeout)
	clearTimeout(forceStop)
	if (!result) {
		process.stderr.write(
			`\nNativeScript exited without a profile${benchmarkError ? `: ${benchmarkError}` : ` (code=${code}, signal=${signal})`}.\n${outputTail}\n`,
		)

		process.exitCode = 1
		return
	}

	process.stdout.write(JSON.stringify(result, null, 2) + '\n')
})
