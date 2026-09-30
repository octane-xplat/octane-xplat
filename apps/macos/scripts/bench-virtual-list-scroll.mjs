import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const rowCount = Number(process.env.OCTANE_MACOS_VLIST_COUNT ?? 5000)
const eventCount = Number(process.env.OCTANE_MACOS_VLIST_EVENTS ?? 180)

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
	throw new Error('The AppKit VirtualList scroll probe requires an Apple Silicon Mac.')
}

if (!Number.isSafeInteger(rowCount) || rowCount < 100 || rowCount > 10000) {
	throw new Error('OCTANE_MACOS_VLIST_COUNT must be an integer from 100 to 10000.')
}

if (!Number.isSafeInteger(eventCount) || eventCount < 30 || eventCount > 1000) {
	throw new Error('OCTANE_MACOS_VLIST_EVENTS must be an integer from 30 to 1000.')
}

const result = await new Promise((resolveSample, rejectSample) => {
	const child = spawn(process.execPath, ['./scripts/dev.mjs'], {
		cwd: appRoot,
		env: {
			...process.env,
			OCTANE_MACOS_AUTOMATION: '1',
			OCTANE_MACOS_VLIST_BENCH: '1',
			OCTANE_MACOS_VLIST_COUNT: String(rowCount),
			OCTANE_MACOS_VLIST_EVENTS: String(eventCount),
			OCTANE_MACOS_VLIST_INPUT: 'programmatic-offset',
			OCTANE_MACOS_VLIST_INTERACTIVE: '1',
			OCTANE_MACOS_VLIST_MODE: 'variable',
		},
		stdio: ['pipe', 'pipe', 'pipe'],
	})

	let output = ''
	let lineBuffer = ''
	let resultData
	let started = false
	const timeout = setTimeout(() => child.kill('SIGTERM'), 120000)

	const onData = (chunk) => {
		output += chunk.toString()
		lineBuffer += chunk.toString()
		let newline
		while ((newline = lineBuffer.indexOf('\n')) >= 0) {
			const line = lineBuffer.slice(0, newline)
			lineBuffer = lineBuffer.slice(newline + 1)
			const readyMarker = '[macos-vlist-ready] '
			const resultMarker = '[macos-vlist-result] '
			const readyIndex = line.indexOf(readyMarker)
			const resultIndex = line.indexOf(resultMarker)
			if (readyIndex >= 0 && !started) {
				started = true
				child.stdin.write('scroll-stream\n')
			}

			if (resultIndex >= 0) {
				try {
					resultData = JSON.parse(line.slice(resultIndex + resultMarker.length))
				} catch (error) {
					clearTimeout(timeout)
					child.kill('SIGTERM')
					rejectSample(error)
				}
			}
		}
	}

	child.stdout.on('data', onData)
	child.stderr.on('data', onData)
	child.on('error', (error) => {
		clearTimeout(timeout)
		rejectSample(error)
	})

	child.on('exit', (code, signal) => {
		clearTimeout(timeout)
		if (resultData) {
			resolveSample(resultData)
			return
		}

		rejectSample(
			new Error(`AppKit scroll probe exited (${signal ?? code}) without metrics:\n${output.slice(-12000)}`),
		)
	})
})

function assertResult(sample) {
	if (
		sample.scrollEvents.count < eventCount ||
		sample.scrollEvents.maxOffset < 250 ||
		sample.scrollEvents.absoluteOffsetDeltaPt < 1000
	) {
		throw new Error(`The programmatic offset stream did not produce sustained scrolling: ${JSON.stringify(sample)}`)
	}

	if (
		sample.current.mountedRowCount > 32 ||
		sample.current.mappedRowCount !== sample.current.mountedRowCount ||
		sample.scrollEvents.rowWindow.peak > 32 ||
		Math.abs(sample.current.scrollViews[0].contentHeight - sample.expectedContentHeight) > 2
	) {
		throw new Error(`The variable-height window exceeded its row or total-height bound: ${JSON.stringify(sample)}`)
	}

	const distinctHeights = new Set(sample.current.mountedRows.map((row) => Math.round(row.height)))
	if (distinctHeights.size !== 3 || sample.current.lastMountedRow !== rowCount - 1) {
		throw new Error(`Expected three row heights and the final data row in the end window: ${JSON.stringify(sample.current)}`)
	}

	if (sample.rangeCommitMs.samples < 1 || sample.mainLoopHeartbeatMs.samples < eventCount / 2) {
		throw new Error(`The scroll run did not collect enough responsiveness samples: ${JSON.stringify(sample)}`)
	}
}

assertResult(result)
console.log(`AppKit variable-height VirtualList scroll probe · ${rowCount} rows · ${eventCount} 8pt offset updates + middle/end seeks`)
console.log(JSON.stringify({ ...result, check: 'passed' }))
