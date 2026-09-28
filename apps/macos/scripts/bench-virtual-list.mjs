import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const requestedSizes = process.env.OCTANE_MACOS_VLIST_SIZES
	? process.env.OCTANE_MACOS_VLIST_SIZES.split(',').map(Number)
	: [500, 2000, 5000]
const requestedModes = process.env.OCTANE_MACOS_VLIST_MODES
	? process.env.OCTANE_MACOS_VLIST_MODES.split(',')
	: ['all', 'windowed']

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
	throw new Error('The AppKit VirtualList probe requires an Apple Silicon Mac.')
}

if (
	requestedSizes.length === 0 ||
	requestedSizes.some((size) => !Number.isSafeInteger(size) || size < 1 || size > 10000) ||
	requestedModes.length === 0 ||
	requestedModes.some((mode) => mode !== 'all' && mode !== 'windowed')
) {
	throw new Error(
		'Set OCTANE_MACOS_VLIST_SIZES to integers from 1 to 10000 and OCTANE_MACOS_VLIST_MODES to all/windowed.',
	)
}

function runSample(size, mode) {
	return new Promise((resolveSample, rejectSample) => {
		const child = spawn(process.execPath, ['./scripts/dev.mjs'], {
			cwd: appRoot,
			env: {
				...process.env,
				OCTANE_MACOS_AUTOMATION: '1',
				OCTANE_MACOS_VLIST_BENCH: '1',
				OCTANE_MACOS_VLIST_COUNT: String(size),
				OCTANE_MACOS_VLIST_MODE: mode,
			},
			stdio: ['ignore', 'pipe', 'pipe'],
		})
		let output = ''
		let lineBuffer = ''
		let result
		let killAfterResult
		const timeout = setTimeout(() => child.kill('SIGTERM'), 120000)

		const onData = (chunk) => {
			output += chunk.toString()
			lineBuffer += chunk.toString()
			let newline
			while ((newline = lineBuffer.indexOf('\n')) >= 0) {
				const line = lineBuffer.slice(0, newline)
				lineBuffer = lineBuffer.slice(newline + 1)
				const marker = '[macos-vlist-bench] '
				const markerIndex = line.indexOf(marker)
				if (markerIndex < 0) {continue}
				try {
					result = JSON.parse(line.slice(markerIndex + marker.length))
					clearTimeout(killAfterResult)
					killAfterResult = setTimeout(() => child.kill('SIGTERM'), 10000)
				} catch (error) {
					child.kill('SIGTERM')
					rejectSample(error)
				}
			}
		}

		child.stdout.on('data', onData)
		child.stderr.on('data', onData)
		child.on('error', (error) => {
			clearTimeout(timeout)
			clearTimeout(killAfterResult)
			rejectSample(error)
		})
		child.on('exit', (code, signal) => {
			clearTimeout(timeout)
			clearTimeout(killAfterResult)
			if (result) {
				resolveSample(result)
				return
			}
			if (signal === 'SIGKILL') {
				resolveSample({ mode, items: size, status: 'killed-before-metrics', signal })
				return
			}
			rejectSample(
				new Error(
					`AppKit VirtualList ${mode} sample for ${size} rows exited (${signal ?? code}) without metrics:\n${output.slice(-12000)}`,
				),
			)
		})
	})
}

function assertSample(result, size, mode) {
	if (result.status === 'killed-before-metrics') {return}
	if (mode === 'all') {
		if (
			result.initial?.mountedRowCount !== size ||
			result.initial?.mappedRowCount !== size ||
			result.initial?.firstMountedRow !== 0 ||
			result.initial?.lastMountedRow !== size - 1
		) {
			throw new Error(`Expected all ${size} rows mounted in order: ${JSON.stringify(result.initial)}`)
		}
		return
	}

	const maxMountedRows = 32
	for (const phase of ['initial', 'afterScroll']) {
		const metrics = result[phase]
		if (!metrics || metrics.mountedRowCount > maxMountedRows || metrics.mappedRowCount !== metrics.mountedRowCount) {
			throw new Error(`${phase} exceeded the ${maxMountedRows}-row window or left stale row nodes: ${JSON.stringify(metrics)}`)
		}
	}
	if (result.initial.firstMountedRow !== 0 || result.initial.lastMountedRow >= maxMountedRows) {
		throw new Error(`The initial window did not start at row 0: ${JSON.stringify(result.initial)}`)
	}
	if (
		result.actualScrollOffset !== result.requestedScrollOffset ||
		result.afterScroll.lastMountedRow !== size - 1 ||
		result.afterScroll.firstMountedRow < Math.max(0, size - maxMountedRows)
	) {
		throw new Error(`The end-of-list window did not reach the requested range: ${JSON.stringify(result.afterScroll)}`)
	}
}

console.log(`AppKit VirtualList probe · ${requestedModes.join(', ')} · ${requestedSizes.join(', ')} rows`)
for (const mode of requestedModes) {
	for (const size of requestedSizes) {
		const result = await runSample(size, mode)
		assertSample(result, size, mode)
		console.log(JSON.stringify({ ...result, check: result.status ?? 'passed' }))
	}
}
