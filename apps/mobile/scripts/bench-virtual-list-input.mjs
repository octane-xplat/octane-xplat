import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const target = process.argv[2]
const heightMode = process.argv[3] ?? 'variable'
const device = process.env.XPLAT_VLIST_DEVICE
const durationMs = Number(process.env.XPLAT_VLIST_INPUT_MS ?? 20_000)
if (target !== 'ios' && target !== 'android') {
	throw new Error(
		'Usage: XPLAT_VLIST_DEVICE=<id> node scripts/bench-virtual-list-input.mjs <ios|android> [variable|fixed48]',
	)
}

if (heightMode !== 'variable' && heightMode !== 'fixed48') {
	throw new Error('Height mode must be variable or fixed48')
}

if (!device) {
	throw new Error('Set XPLAT_VLIST_DEVICE to the simulator UDID or Android device serial')
}

if (!Number.isSafeInteger(durationMs) || durationMs < 10_000) {
	throw new Error('XPLAT_VLIST_INPUT_MS must be an integer of at least 10000')
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
		'export const VIRTUAL_LIST_INPUT_DURATION_MS = 20_000',
	].join('\n') + '\n'

if (originalModes.some((mode) => mode !== disabledMode)) {
	throw new Error(
		`Unexpected benchmark mode source in ${modeFiles.join(', ')}; refusing to overwrite it`,
	)
}

const enabledMode =
	[
		'export const VIRTUAL_LIST_BENCH_MODE = true',
		'export const VIRTUAL_LIST_INPUT_MODE = true',
		`export const VIRTUAL_LIST_BENCH_FIXED_MODE = ${heightMode === 'fixed48'}`,
		`export const VIRTUAL_LIST_INPUT_DURATION_MS = ${durationMs}`,
	].join('\n') + '\n'

for (const modeFile of modeFiles) {
	writeFileSync(modeFile, enabledMode)
}

let modeRestored = false
const restoreMode = () => {
	if (modeRestored) {
		return
	}

	modeFiles.forEach((modeFile, index) => writeFileSync(modeFile, originalModes[index]))
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
let gestureError = ''
let gesturePromise
let gestureSummary
let memoryTimer
const memorySamples = []
let androidFrameStats = null
const readyMarker = '[vlist-input] ready '
const resultMarker = '[vlist-input] result '
const errorMarker = '[vlist-input] error '
let forceStop
let resultPrinted = false
let ownsApp = false
let stopping = false
const hasVerifiedInput = () => Boolean(result?.scroll?.movementSamples > 0 && gestureSummary?.swipeCount > 0 && !gestureError)

const printResult = () => {
	if (!result || resultPrinted) {
		return
	}

	process.stdout.write(
		JSON.stringify(
			{
				...result,
				inputVerification: hasVerifiedInput() ? 'observed-scroll' : 'invalid-or-unobserved-input',
				input: 'Synthetic idb/adb swipes; not direct finger input',
				gestures: gestureSummary ?? 'not-started',
				gestureError,
				memorySamples,
				androidFrameStats,
			},
			null,
			2,
		) + '\n',
	)

	resultPrinted = true
}

const signalRun = (signal) => {
	if (!child.pid) {
		return
	}

	try {
		if (process.platform === 'win32') {
			child.kill(signal)
		} else {
			process.kill(-child.pid, signal)
		}
	} catch {}
}

const stopRun = () => {
	stopping = true
	if (forceStop) {
		return
	}

	if (ownsApp) {
		ownsApp = false
		const appId = process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat.vlistbench'
		try {
			if (target === 'ios') {
				execFileSync('xcrun', ['simctl', 'terminate', device, appId], { timeout: 8000, stdio: 'ignore' })
			} else {
				execFileSync('adb', ['-s', device, 'shell', 'am', 'force-stop', appId], { timeout: 8000, stdio: 'ignore' })
			}
		} catch {}
	}

	signalRun('SIGINT')
	forceStop = setTimeout(() => {
		signalRun('SIGTERM')
		forceStop = setTimeout(() => {
			signalRun('SIGKILL')
			restoreMode()
			printResult()
			process.exit(hasVerifiedInput() ? 0 : 1)
		}, 5000)

		forceStop.unref()
	}, 5000)

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

const timeout = setTimeout(() => stopRun(), 45 * 60_000)

function sampleMemory() {
	try {
		if (target === 'android') {
			const output = execFileSync(
				'adb',
				[
					'-s',
					device,
					'shell',
					'dumpsys',
					'meminfo',
					process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat.vlistbench',
				],
				{ encoding: 'utf8', timeout: 8000 },
			)

			const match = output.match(/TOTAL PSS:\s+([\d,]+)/)
			if (match) {
				const summary = Object.fromEntries(
					['Java Heap', 'Native Heap', 'Code', 'Stack', 'Graphics', 'Private Other', 'System'].map((name) => {
						const category = output.match(new RegExp(name + ':\\s+([\\d,]+)'))?.[1]
						return [name, category === undefined ? null : Number(category.replaceAll(',', ''))]
					}),
				)

				memorySamples.push({
					at: Date.now(),
					metric: 'totalPssKb',
					value: Number(match[1].replaceAll(',', '')),
					summaryPssKb: summary,
					gc: 'not-requested',
				})
			}

			return
		}

		const apps = execFileSync('idb', ['list-apps', '--udid', device], {
			encoding: 'utf8',
			timeout: 8000,
		})

		const appLine = apps
			.split(/\r?\n/)
			.find((line) =>
				line.includes(process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat.vlistbench'),
			)

		const pid = appLine?.match(/pid=(\d+)/)?.[1]
		if (!pid) {
			return
		}

		const rss = execFileSync('ps', ['-o', 'rss=', '-p', pid], {
			encoding: 'utf8',
			timeout: 3000,
		}).trim()

		if (rss) {
			memorySamples.push({ at: Date.now(), metric: 'hostRssKb', value: Number(rss) })
		}
	} catch (error) {
		memorySamples.push({
			at: Date.now(),
			error: error instanceof Error ? error.message : String(error),
		})
	}
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function sendInputGestures() {
	let width
	let height
	let duration
	if (target === 'android') {
		const output = execFileSync('adb', ['-s', device, 'shell', 'wm', 'size'], { encoding: 'utf8' })
		const size = output.match(/(?:Physical|Override) size:\s*(\d+)x(\d+)/)
		if (!size) {
			throw new Error(`Could not read Android screen size: ${output}`)
		}

		width = Number(size[1])
		height = Number(size[2])
		duration = '450'
	} else {
		const output = execFileSync('idb', ['describe', '--udid', device, '--json'], {
			encoding: 'utf8',
		})

		const description = JSON.parse(output)
		width = description.screen_dimensions?.width_points
		height = description.screen_dimensions?.height_points
		if (!width || !height) {
			throw new Error(`Could not read iOS simulator point size: ${output}`)
		}

		duration = '0.45'
	}

	const x = Math.round(width / 2)
	const lower = Math.round(height * 0.82)
	const upper = Math.round(height * 0.34)
	const directions = ['down', 'up', 'down', 'up', 'down', 'up', 'down', 'up']
	let swipeCount = 0
	let rounds = 0
	const startedAt = Date.now()
	while (!stopping && Date.now() - startedAt < durationMs - 1000) {
		let roundSwipes = 0
		for (const direction of directions) {
			if (stopping || Date.now() - startedAt >= durationMs - 1000) {
				break
			}

			const fromY = direction === 'down' ? lower : upper
			const toY = direction === 'down' ? upper : lower
			if (target === 'android') {
				execFileSync(
					'adb',
					[
						'-s',
						device,
						'shell',
						'input',
						'swipe',
						String(x),
						String(fromY),
						String(x),
						String(toY),
						duration,
					],
					{ stdio: 'ignore', timeout: 5000 },
				)
			} else {
				execFileSync(
					'idb',
					[
						'ui',
						'swipe',
						'--udid',
						device,
						'--duration',
						duration,
						'--reason',
						'VirtualList input performance profile',
						String(x),
						String(fromY),
						String(x),
						String(toY),
					],
					{ stdio: 'ignore', timeout: 8000 },
				)
			}

			swipeCount += 1
			roundSwipes += 1
			await pause(300)
		}

		if (roundSwipes === 0) {
			break
		}

		rounds += 1
	}

	return {
		target,
		device,
		dimensions: [width, height],
		unit: target === 'ios' ? 'points' : 'pixels',
		swipeCount,
		rounds,
	}
}

const consume = (chunk) => {
	const text = String(chunk)
	process.stderr.write(text)
	outputTail = (outputTail + text).slice(-12_000)
	partialLine += text
	const lines = partialLine.split(/\r?\n/)
	partialLine = lines.pop() ?? ''
	for (const line of lines) {
		const readyAt = line.indexOf(readyMarker)
		if (readyAt !== -1 && !gesturePromise) {
			ownsApp = true
			const memoryIntervalMs = durationMs >= 60_000 ? 30_000 : 5000
			memoryTimer = setInterval(sampleMemory, memoryIntervalMs)
			sampleMemory()
			gesturePromise = sendInputGestures()
				.then((summary) => {
					gestureSummary = summary
					return summary
				})
				.catch((error) => {
					gestureError = error instanceof Error ? error.message : String(error)
					gestureSummary = { target, device, error: gestureError }
					return gestureSummary
				})
		}

		const errorAt = line.indexOf(errorMarker)
		if (errorAt !== -1) {
			gestureError = line.slice(errorAt + errorMarker.length)
			clearTimeout(timeout)
			stopRun()
			continue
		}

		const resultAt = line.indexOf(resultMarker)
		if (resultAt === -1) {
			continue
		}

		try {
			result = JSON.parse(line.slice(resultAt + resultMarker.length))
			clearTimeout(timeout)
			void Promise.resolve(gesturePromise).then(() => {
				clearInterval(memoryTimer)
				sampleMemory()
				if (target === 'android') {
					try {
						const raw = execFileSync(
							'adb',
							[
								'-s',
								device,
								'shell',
								'dumpsys',
								'gfxinfo',
								process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat.vlistbench',
								'framestats',
							],
							{ encoding: 'utf8', timeout: 8000 },
						)

						androidFrameStats = {
							source: 'dumpsys gfxinfo framestats',
							scope: 'bounded platform frame-history buffer; not the entire session',
							raw,
						}
					} catch (error) {
						androidFrameStats = { error: String(error) }
					}
				}

				printResult()
				stopRun()
			})
		} catch (error) {
			gestureError = `Could not parse input profile JSON: ${error}`
		}
	}
}

child.stdout.on('data', consume)
child.stderr.on('data', consume)
child.on('error', (error) => {
	restoreMode()
	clearTimeout(timeout)
	clearInterval(memoryTimer)
	clearTimeout(forceStop)
	process.stderr.write(`${error.stack ?? error}\n`)
	process.exitCode = 1
})

child.on('close', (code, signal) => {
	restoreMode()
	clearTimeout(timeout)
	clearInterval(memoryTimer)
	clearTimeout(forceStop)
	if (!result) {
		process.stderr.write(
			`\nNativeScript exited without an input profile${gestureError ? `: ${gestureError}` : ` (code=${code}, signal=${signal})`}.\n${outputTail}\n`,
		)

		process.exitCode = 1
		return
	}

	printResult()
	if (!hasVerifiedInput()) {process.exitCode = 1}
})
