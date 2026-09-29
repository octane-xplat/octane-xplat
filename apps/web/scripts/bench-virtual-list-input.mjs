import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const mode = process.argv[2] ?? 'variable'
const durationMs = Number(process.env.XPLAT_VLIST_INPUT_MS ?? 15_000)
if (mode !== 'variable' && mode !== 'fixed48') {
	throw new Error('Usage: node scripts/bench-virtual-list-input.mjs <variable|fixed48>')
}

if (!Number.isFinite(durationMs) || durationMs < 5_000) {
	throw new Error('XPLAT_VLIST_INPUT_MS must be at least 5000')
}

const preview = spawn('pnpm', ['exec', 'vite', 'preview'], {
	cwd: process.cwd(),
	stdio: ['ignore', 'pipe', 'pipe'],
	detached: true,
})

let previewOutput = ''
let baseUrl
let browser
let memoryTimer
try {
	await new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error(`Timed out waiting for Vite preview: ${previewOutput}`)), 15_000)
		const onData = (chunk) => {
			previewOutput += String(chunk)
			if (!baseUrl) {baseUrl = previewOutput.match(/Local:\s+(https?:\/\/\S+)/)?.[1]}
			if (baseUrl) {
				clearTimeout(timeout)
				resolve()
			}
		}

		preview.stdout.on('data', onData)
		preview.stderr.on('data', onData)
		preview.on('exit', (code) => {
			clearTimeout(timeout)
			reject(new Error(`Vite preview exited before ready (${code}): ${previewOutput}`))
		})
	})

	browser = await chromium.launch()
	const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
	const pageErrors = []
	page.on('pageerror', (error) => pageErrors.push(error.message))
	await page.goto(baseUrl, { waitUntil: 'networkidle' })
	await page.locator('button:text("Test")').click()
	await page.locator('#menu-vlist-perf').click()
	const list = page.locator('#vlist-bench-list')
	await list.waitFor({ state: 'visible', timeout: 10_000 })
	if (mode === 'fixed48') {
		await page.locator('#vlist-bench-height-mode').click()
		await page.waitForFunction(
			() => {
				const rows = [...document.querySelectorAll('#vlist-bench-list [id^="vlist-bench-row-"]')]
				return rows.length > 0 && rows.every((row) => Math.abs(row.getBoundingClientRect().height - 48) < 0.5)
			},
			null,
			{ timeout: 10_000 },
		)
	}

	await page.waitForTimeout(500)

	const cdp = await page.context().newCDPSession(page)
	await cdp.send('Runtime.enable')
	await cdp.send('HeapProfiler.enable')
	await cdp.send('HeapProfiler.collectGarbage')
	const heapBefore = await cdp.send('Runtime.getHeapUsage')
	const domBefore = await cdp.send('Memory.getDOMCounters').catch(() => null)
	const memoryStartedAt = Date.now()
	const memorySamples = [{ atMs: 0, phase: 'before', heapUsedBytes: heapBefore.usedSize, dom: domBefore }]
	let memorySamplePending = false
	const sampleMemory = async (phase) => {
		if (memorySamplePending) {return}
		memorySamplePending = true
		try {
			const heap = await cdp.send('Runtime.getHeapUsage')
			const dom = await cdp.send('Memory.getDOMCounters').catch(() => null)
			memorySamples.push({
				atMs: Date.now() - memoryStartedAt,
				phase,
				heapUsedBytes: heap.usedSize,
				dom,
			})
		} finally {
			memorySamplePending = false
		}
	}

	memoryTimer = setInterval(() => { void sampleMemory('periodic') }, 30_000)
	const box = await list.boundingBox()
	if (!box) {throw new Error('VirtualList benchmark did not have a visible bounds box')}
	const x = box.x + box.width / 2
	const y = box.y + Math.min(box.height - 40, 300)
	const initial = await page.evaluate(() => {
		const list = document.querySelector('#vlist-bench-list')
		return {
			viewportHeight: list?.clientHeight ?? 0,
			contentHeight: list?.scrollHeight ?? 0,
			rowHeights: [...(list?.querySelectorAll('[id^="vlist-bench-row-"]') ?? [])]
				.slice(0, 8)
				.map((row) => Number(row.getBoundingClientRect().height.toFixed(1))),
		}
	})

	if (initial.viewportHeight <= 0 || initial.rowHeights.length === 0) {
		throw new Error('VirtualList benchmark did not expose a laid-out row window')
	}

	await page.evaluate(() => {
		const list = document.querySelector('#vlist-bench-list')
		const trace = {
			phase: 'idle',
			frames: [],
			samples: [],
			scrollEvents: {},
			start: performance.now(),
			lastFrame: undefined,
			lastSample: 0,
			stop: false,
		}

		list.addEventListener(
			'scroll',
			() => {
				trace.scrollEvents[trace.phase] = (trace.scrollEvents[trace.phase] ?? 0) + 1
			},
			{ passive: true },
		)

		const tick = (now) => {
			if (trace.lastFrame !== undefined) {trace.frames.push({ phase: trace.phase, ms: now - trace.lastFrame })}
			trace.lastFrame = now
			if (now - trace.lastSample >= 100) {
				const rect = list.getBoundingClientRect()
				const rows = [...list.querySelectorAll('[id^="vlist-bench-row-"]')]
					.map((row) => row.getBoundingClientRect())
					.filter((row) => row.bottom > rect.top && row.top < rect.bottom)
					.sort((a, b) => a.top - b.top)

				let coveredUntil = rect.top
				let gap = 0
				for (const row of rows) {
					if (row.top > coveredUntil + 1) {gap += row.top - coveredUntil}
					coveredUntil = Math.max(coveredUntil, row.bottom)
				}

				if (coveredUntil < rect.bottom - 1) {gap += rect.bottom - coveredUntil}
				trace.samples.push({
					phase: trace.phase,
					time: now - trace.start,
					offset: list.scrollTop,
					mounted: list.querySelectorAll('[id^="vlist-bench-row-"]').length,
					gap,
				})

				trace.lastSample = now
			}

			if (!trace.stop) {requestAnimationFrame(tick)}
		}

		window.__vlistInputTrace = trace
		requestAnimationFrame(tick)
	})

	const startedAt = Date.now()
	let inputRound = 0
	while (Date.now() - startedAt < durationMs) {
		inputRound += 1
		for (const direction of [1, -1]) {
			await page.evaluate((phase) => (window.__vlistInputTrace.phase = phase), `wheel-${direction > 0 ? 'down' : 'up'}`)
			await page.mouse.move(x, y)
			for (let tick = 0; tick < 6; tick += 1) {
				await page.mouse.wheel(0, direction * 420)
				await page.waitForTimeout(45)
			}

			await page.waitForTimeout(160)
		}

		if (inputRound % 4 === 0) {process.stderr.write(`input round ${inputRound} / ${durationMs} ms\n`)}
	}

	await page.waitForTimeout(500)
	clearInterval(memoryTimer)
	await sampleMemory('pre-gc')
	const trace = await page.evaluate((inputRounds) => {
		const trace = window.__vlistInputTrace
		trace.stop = true
		const phases = [...new Set(trace.samples.map((sample) => sample.phase))]
		const percentile = (values, p) => {
			const sorted = [...values].sort((a, b) => a - b)
			return sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))].toFixed(2)) : null
		}

		const summarizePhase = (phase) => {
			const samples = trace.samples.filter((sample) => sample.phase === phase)
			const deltas = samples.slice(1).map((sample, index) => sample.offset - samples[index].offset).filter((delta) => Math.abs(delta) > 0.5)
			let directionChanges = 0
			let previousDirection = 0
			for (const delta of deltas) {
				const direction = Math.sign(delta)
				if (previousDirection && previousDirection !== direction) {directionChanges += 1}
				previousDirection = direction
			}

			return {
				scrollEvents: trace.scrollEvents[phase] ?? 0,
				offsetChanges: deltas.length,
				distance: Number(deltas.reduce((sum, delta) => sum + Math.abs(delta), 0).toFixed(1)),
				directionChanges,
				maxMountedRows: samples.length ? Math.max(...samples.map((sample) => sample.mounted)) : 0,
				coverageGapSamples: samples.filter((sample) => sample.gap > 1).length,
				maxCoverageGap: samples.length ? Number(Math.max(...samples.map((sample) => sample.gap)).toFixed(1)) : 0,
			}
		}

		const frames = trace.frames.map((sample) => sample.ms)
		return {
			durationMs: Number((performance.now() - trace.start).toFixed(1)),
			sampleCount: trace.samples.length,
			phases: Object.fromEntries(phases.map((phase) => [phase, summarizePhase(phase)])),
			rAFIntervalMs: {
				p50: percentile(frames, 0.5),
				p95: percentile(frames, 0.95),
				max: frames.length ? Number(Math.max(...frames).toFixed(2)) : null,
				longerThan32ms: frames.filter((ms) => ms > 32).length,
			},
			mountedRows: {
				p50: percentile(trace.samples.map((sample) => sample.mounted), 0.5),
				max: trace.samples.length ? Math.max(...trace.samples.map((sample) => sample.mounted)) : 0,
			},
			coverageGapSamples: trace.samples.filter((sample) => sample.gap > 1).length,
			maxCoverageGap: trace.samples.length ? Number(Math.max(...trace.samples.map((sample) => sample.gap)).toFixed(1)) : 0,
			inputRounds,
		}
	}, inputRound)

	await cdp.send('HeapProfiler.collectGarbage')
	const heapAfter = await cdp.send('Runtime.getHeapUsage')
	const domAfter = await cdp.send('Memory.getDOMCounters').catch(() => null)
	memorySamples.push({
		atMs: Date.now() - memoryStartedAt,
		phase: 'after-gc',
		heapUsedBytes: heapAfter.usedSize,
		dom: domAfter,
	})

	if (pageErrors.length) {throw new Error(`Web app errors: ${pageErrors.join('; ')}`)}
	console.log(
		JSON.stringify(
			{
			schema: 'xplat.virtual-list-input.v1',
			target: 'web',
			fixture: { mode, rows: 5000, viewportHeight: initial.viewportHeight, contentHeight: initial.contentHeight, initialRowHeights: initial.rowHeights },
			input: 'Playwright mouse-wheel events; emulated input, not physical trackpad',
			trace,
			memoryBytes: { heapBefore: heapBefore.usedSize, heapAfter: heapAfter.usedSize, heapDelta: heapAfter.usedSize - heapBefore.usedSize },
			memorySamples,
			domBefore,
			domAfter,
			pageErrors,
			baseUrl,
		},
			null,
			2,
		),
	)
} finally {
	clearInterval(memoryTimer)
	await browser?.close()
	if (preview.pid) {
		try {
			process.kill(-preview.pid, 'SIGTERM')
		} catch {}
	}
}
