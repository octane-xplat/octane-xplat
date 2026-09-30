export const VIRTUAL_LIST_BENCH_ROW_COUNT = 5_000
export const VIRTUAL_LIST_BENCH_INTERVAL_MS = 16
export const VIRTUAL_LIST_BENCH_STEPS_PER_DIRECTION = 250
export const VIRTUAL_LIST_BENCH_STEP_UNITS = 48
export const VIRTUAL_LIST_BENCH_MAX_SETTLE_MS = 250

export type VirtualListBenchItem = {
	id: string
	index: number
	height: number
}

export type VirtualListBenchTarget = 'web' | 'ios' | 'android' | 'macos'

export type VirtualListBenchRowBox = {
	index: number
	top: number
	bottom: number
}

export type VirtualListBenchSnapshot = {
	offset: number
	viewportHeight: number
	rows: VirtualListBenchRowBox[]
	mountedIndices: number[]
}

export type VirtualListBenchAdapter = {
	target: VirtualListBenchTarget
	read(): VirtualListBenchSnapshot
	writeOffset(offset: number): void
	wait(): Promise<void>
}

export function virtualListBenchRowHeight(index: number) {
	return 32 + (index % 5) * 8
}

export const VIRTUAL_LIST_BENCH_ITEMS: VirtualListBenchItem[] = Array.from(
	{ length: VIRTUAL_LIST_BENCH_ROW_COUNT },
	(_, index) => ({
		id: `row-${index}`,
		index,
		height: virtualListBenchRowHeight(index),
	}),
)

export const VIRTUAL_LIST_BENCH_FIXED_ITEMS: VirtualListBenchItem[] = VIRTUAL_LIST_BENCH_ITEMS.map(
	(item) => ({ ...item, height: 48 }),
)

const rowOffsets = (() => {
	const offsets = new Array<number>(VIRTUAL_LIST_BENCH_ROW_COUNT + 1)
	offsets[0] = 0
	for (let index = 0; index < VIRTUAL_LIST_BENCH_ROW_COUNT; index += 1) {
		offsets[index + 1] = offsets[index] + virtualListBenchRowHeight(index)
	}

	return offsets
})()

export const VIRTUAL_LIST_BENCH_TOTAL_HEIGHT = rowOffsets[VIRTUAL_LIST_BENCH_ROW_COUNT]

function indexAtOffset(offset: number) {
	let low = 0
	let high = VIRTUAL_LIST_BENCH_ROW_COUNT
	while (low < high) {
		const middle = Math.floor((low + high) / 2)
		if (rowOffsets[middle + 1] <= offset) {low = middle + 1}
		else {high = middle}
	}

	return Math.min(low, VIRTUAL_LIST_BENCH_ROW_COUNT - 1)
}

export function virtualListBenchVisibleRange(offset: number, viewportHeight: number) {
	const start = indexAtOffset(Math.max(0, offset))
	const last = indexAtOffset(
		Math.max(0, Math.min(VIRTUAL_LIST_BENCH_TOTAL_HEIGHT - 1, offset + viewportHeight - 1)),
	)

	return { start, end: Math.min(VIRTUAL_LIST_BENCH_ROW_COUNT, last + 1) }
}

/**
 * Apply a 48-unit, 60 Hz forward/backward stream, then seek into deep list
 * positions. The stream exercises overscan handoff; the seeks check that
 * windowing also works far from the initial rows.
 */
export function createVirtualListBenchTrace() {
	const forward = Array.from(
		{ length: VIRTUAL_LIST_BENCH_STEPS_PER_DIRECTION + 1 },
		(_, step) => step * VIRTUAL_LIST_BENCH_STEP_UNITS,
	)

	const backward = Array.from(
		{ length: VIRTUAL_LIST_BENCH_STEPS_PER_DIRECTION },
		(_, step) =>
			(VIRTUAL_LIST_BENCH_STEPS_PER_DIRECTION - step - 1) * VIRTUAL_LIST_BENCH_STEP_UNITS,
	)

	const seekOffsets = [0.25, 0.5, 0.75, 0.99, 0].map((fraction) =>
		Math.round((VIRTUAL_LIST_BENCH_TOTAL_HEIGHT - 900) * fraction),
	)

	return {
		streamRange: [0, VIRTUAL_LIST_BENCH_STEPS_PER_DIRECTION * VIRTUAL_LIST_BENCH_STEP_UNITS],
		seekOffsets,
		streamOffsets: [...forward, ...backward],
	}
}

function percentile(values: number[], p: number) {
	if (values.length === 0) {return null}
	const sorted = [...values].sort((a, b) => a - b)
	return Number(sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)].toFixed(2))
}

function summarize(values: number[]) {
	if (values.length === 0) {return { samples: 0, p50: null, p95: null, max: null }}
	return {
		samples: values.length,
		p50: percentile(values, 50),
		p95: percentile(values, 95),
		max: Number(Math.max(...values).toFixed(2)),
	}
}

function snapshotCoverage(snapshot: VirtualListBenchSnapshot) {
	const { start, end } = virtualListBenchVisibleRange(snapshot.offset, snapshot.viewportHeight)
	const mounted = new Set(snapshot.mountedIndices)
	let missingVisibleRows = 0
	for (let index = start; index < end; index += 1) {
		if (!mounted.has(index)) {missingVisibleRows += 1}
	}

	const visible = snapshot.rows
		.map((row) => ({
			top: Math.max(0, row.top),
			bottom: Math.min(snapshot.viewportHeight, row.bottom),
		}))
		.filter((row) => row.bottom > row.top)
		.sort((a, b) => a.top - b.top)

	let coveredUntil = 0
	let maxGap = 0
	for (const row of visible) {
		if (row.top > coveredUntil) {maxGap = Math.max(maxGap, row.top - coveredUntil)}
		coveredUntil = Math.max(coveredUntil, row.bottom)
	}

	if (snapshot.viewportHeight > coveredUntil) {
		maxGap = Math.max(maxGap, snapshot.viewportHeight - coveredUntil)
	}

	return { missingVisibleRows, maxGap }
}

export async function runVirtualListInputTrace(
	adapter: Pick<VirtualListBenchAdapter, 'target' | 'read' | 'wait'>,
	durationMs = 20_000,
) {
	const performanceApi = (globalThis as any).performance
	const now = () => performanceApi?.now?.() ?? Date.now()
	let first = adapter.read()
	const readyDeadline = now() + 10_000
	while (
		(first.viewportHeight <= 0 || first.mountedIndices.length === 0) &&
		now() < readyDeadline
	) {
		await adapter.wait()
		first = adapter.read()
	}

	if (first.viewportHeight <= 0 || first.mountedIndices.length === 0) {
		throw new Error('VirtualList input profile could not read a laid-out list viewport')
	}

	if (!Number.isFinite(durationMs) || durationMs <= 0) {
		throw new Error('VirtualList input profile duration must be positive')
	}

	const startedAt = now()
	const intervalSamples: number[] = []
	const mountedSamples = [first.mountedIndices.length]
	const gapSamples: number[] = []
	const offsets = [first.offset]
	let mountedRowsAdded = 0
	let mountedRowsRemoved = 0
	let previousMounted = new Set(first.mountedIndices)
	let previousAt = startedAt

	let worstGeometry: null | {
		offset: number
		viewportHeight: number
		leadingGap: number
		trailingGap: number
		internalGap: number
		rows: VirtualListBenchRowBox[]
	} = null

	const visibleGap = (snapshot: VirtualListBenchSnapshot) => {
		const visible = snapshot.rows
			.map((row) => ({
				top: Math.max(0, row.top),
				bottom: Math.min(snapshot.viewportHeight, row.bottom),
			}))
			.filter((row) => row.bottom > row.top)
			.sort((a, b) => a.top - b.top)

		const leadingGap = visible[0]?.top ?? snapshot.viewportHeight
		let coveredUntil = visible[0]?.bottom ?? 0
		let internalGap = 0
		for (const row of visible.slice(1)) {
			internalGap = Math.max(internalGap, row.top - coveredUntil)
			coveredUntil = Math.max(coveredUntil, row.bottom)
		}

		const trailingGap = Math.max(0, snapshot.viewportHeight - coveredUntil)
		const maxGap = Math.max(leadingGap, trailingGap, internalGap)
		const previousMax = worstGeometry
			? Math.max(worstGeometry.leadingGap, worstGeometry.trailingGap, worstGeometry.internalGap)
			: 1

		if (maxGap > previousMax) {
			worstGeometry = {
				offset: snapshot.offset,
				viewportHeight: snapshot.viewportHeight,
				leadingGap,
				trailingGap,
				internalGap,
				rows: snapshot.rows.map((row) => ({ ...row })),
			}
		}

		return maxGap
	}

	while (now() - startedAt < durationMs) {
		await adapter.wait()
		const snapshot = adapter.read()
		const sampledAt = now()
		intervalSamples.push(Math.max(0, sampledAt - previousAt))
		previousAt = sampledAt
		const nextMounted = new Set(snapshot.mountedIndices)
		for (const index of nextMounted) {
			if (!previousMounted.has(index)) {mountedRowsAdded += 1}
		}

		for (const index of previousMounted) {
			if (!nextMounted.has(index)) {mountedRowsRemoved += 1}
		}

		previousMounted = nextMounted
		mountedSamples.push(snapshot.mountedIndices.length)
		gapSamples.push(visibleGap(snapshot))
		offsets.push(snapshot.offset)
	}

	const movements = offsets.slice(1).map((offset, index) => offset - offsets[index])
	const nonzeroMovements = movements.filter((delta) => Math.abs(delta) > 0.5)
	let directionChanges = 0
	let previousDirection = 0
	for (const delta of nonzeroMovements) {
		const direction = Math.sign(delta)
		if (previousDirection !== 0 && previousDirection !== direction) {directionChanges += 1}
		previousDirection = direction
	}

	const maxOffset = offsets.length ? Math.max(...offsets) : 0
	const minOffset = offsets.length ? Math.min(...offsets) : 0
	const maxVelocity = movements.reduce((max, delta, index) => {
		const interval = intervalSamples[index] ?? 0
		return interval > 0 ? Math.max(max, (Math.abs(delta) / interval) * 1000) : max
	}, 0)

	return {
		schema: 'xplat.virtual-list-input.v2',
		framePacing: { status: 'not-collected', pollingIsFramePacing: false },
		target: adapter.target,
		fixture: { rowCount: VIRTUAL_LIST_BENCH_ROW_COUNT },
		durationMs: Number((now() - startedAt).toFixed(1)),
		samples: intervalSamples.length + 1,
		sampleIntervalMs: summarize(intervalSamples),
		laggedSamples: intervalSamples.filter((interval) => interval > 32).length,
		scroll: {
			movementSamples: nonzeroMovements.length,
			distance: Number(
				nonzeroMovements.reduce((sum, delta) => sum + Math.abs(delta), 0).toFixed(1),
			),
			startOffset: Number((offsets[0] ?? 0).toFixed(1)),
			endOffset: Number((offsets.at(-1) ?? 0).toFixed(1)),
			minOffset: Number(minOffset.toFixed(1)),
			maxOffset: Number(maxOffset.toFixed(1)),
			directionChanges,
			maxVelocity: Number(maxVelocity.toFixed(1)),
		},
		mountedRows: summarize(mountedSamples),
		coverage: {
			samples: gapSamples.length,
			gapSamples: gapSamples.filter((gap) => gap > 1).length,
			worstGeometry,
			maxGap: Number((gapSamples.length ? Math.max(...gapSamples) : 0).toFixed(1)),
		},
		rowChurn: { mounted: mountedRowsAdded, unmounted: mountedRowsRemoved },
	}
}

/** Run the same scripted trace against the DOM and NativeScript list leaves. */
export async function runVirtualListBenchTrace(adapter: VirtualListBenchAdapter) {
	const trace = createVirtualListBenchTrace()
	const wait = adapter.wait
	const performanceApi = (globalThis as any).performance
	const now = () => performanceApi?.now?.() ?? Date.now()
	const rowsReadyForOffset = (snapshot: VirtualListBenchSnapshot, offset: number) => {
		const bounded = Math.max(
			0,
			Math.min(offset, VIRTUAL_LIST_BENCH_TOTAL_HEIGHT - snapshot.viewportHeight),
		)

		const { start, end } = virtualListBenchVisibleRange(bounded, snapshot.viewportHeight)
		const mounted = new Set(snapshot.mountedIndices)
		for (let index = start; index < end; index += 1) {
			if (!mounted.has(index)) {return false}
		}

		return true
	}

	let first = adapter.read()
	const readyDeadline = now() + 10_000
	while (
		(first.viewportHeight <= 0 || first.mountedIndices.length === 0) &&
		now() < readyDeadline
	) {
		await wait()
		first = adapter.read()
	}

	if (first.viewportHeight <= 0 || first.mountedIndices.length === 0) {
		throw new Error('VirtualList benchmark could not read a laid-out list viewport')
	}

	const startedAt = now()
	const streamIntervalSamples: number[] = []
	const seekLatencySamples: number[] = []
	const mountedSamples: number[] = []
	const eventLoopDriftSamples: number[] = []
	const streamCoverage = {
		samples: 0,
		gapSamples: 0,
		maxMissingVisibleRows: 0,
		maxGapUnits: 0,
		worst: null as null | { offset: number; missing: number; gap: number },
	}

	const seekCoverage = {
		samples: 0,
		gapSamples: 0,
		maxMissingVisibleRows: 0,
		maxGapUnits: 0,
		worst: null as null | { offset: number; missing: number; gap: number },
	}

	let coverageSamples = 0
	let visibleGapSamples = 0
	let missingVisibleRows = 0
	let maxVisibleGap = 0
	let maxMissingVisibleRows = 0
	let mountedRowsAdded = 0
	let mountedRowsRemoved = 0
	let laggedStreamFrames = 0
	let seekTimeouts = 0
	const seekTimeoutOffsets: number[] = []
	const seekResults: Array<Record<string, unknown>> = []
	let previousMounted = new Set(first.mountedIndices)
	let previousStreamIssueAt: number | null = null
	let heartbeatDue = startedAt + 25
	let heartbeatTimer: ReturnType<typeof setTimeout> | undefined
	let heartbeatStopped = false

	const heartbeat = () => {
		if (heartbeatStopped) {return}
		const firedAt = now()
		eventLoopDriftSamples.push(Math.max(0, firedAt - heartbeatDue))
		heartbeatDue = firedAt + 25
		heartbeatTimer = setTimeout(heartbeat, 25)
	}

	heartbeatTimer = setTimeout(heartbeat, 25)

	const recordSnapshot = (
		snapshot: VirtualListBenchSnapshot,
		phaseCoverage: typeof streamCoverage,
	) => {
		const nextMounted = new Set(snapshot.mountedIndices)
		for (const index of nextMounted) {
			if (!previousMounted.has(index)) {mountedRowsAdded += 1}
		}

		for (const index of previousMounted) {
			if (!nextMounted.has(index)) {mountedRowsRemoved += 1}
		}

		previousMounted = nextMounted
		mountedSamples.push(snapshot.mountedIndices.length)

		const coverage = snapshotCoverage(snapshot)
		phaseCoverage.samples += 1
		phaseCoverage.maxMissingVisibleRows = Math.max(
			phaseCoverage.maxMissingVisibleRows,
			coverage.missingVisibleRows,
		)

		phaseCoverage.maxGapUnits = Math.max(phaseCoverage.maxGapUnits, coverage.maxGap)
		if (coverage.missingVisibleRows > 0 || coverage.maxGap > 1) {
			phaseCoverage.gapSamples += 1
			if (
				!phaseCoverage.worst ||
				coverage.maxGap > phaseCoverage.worst.gap ||
				coverage.missingVisibleRows > phaseCoverage.worst.missing
			) {
				phaseCoverage.worst = {
					offset: Number(snapshot.offset.toFixed(2)),
					missing: coverage.missingVisibleRows,
					gap: Number(coverage.maxGap.toFixed(2)),
				}
			}
		}

		coverageSamples += 1
		missingVisibleRows += coverage.missingVisibleRows
		maxMissingVisibleRows = Math.max(maxMissingVisibleRows, coverage.missingVisibleRows)
		maxVisibleGap = Math.max(maxVisibleGap, coverage.maxGap)
		if (coverage.missingVisibleRows > 0 || coverage.maxGap > 1) {visibleGapSamples += 1}
	}

	for (const targetOffset of trace.streamOffsets) {
		const issuedAt = now()
		if (previousStreamIssueAt !== null) {streamIntervalSamples.push(issuedAt - previousStreamIssueAt)}
		previousStreamIssueAt = issuedAt
		adapter.writeOffset(targetOffset)
		await wait()
		const snapshot = adapter.read()
		recordSnapshot(snapshot, streamCoverage)
		const clampedTarget = Math.max(
			0,
			Math.min(targetOffset, VIRTUAL_LIST_BENCH_TOTAL_HEIGHT - snapshot.viewportHeight),
		)

		if (
			Math.abs(snapshot.offset - clampedTarget) > 2 ||
			!rowsReadyForOffset(snapshot, clampedTarget)
		) {
			laggedStreamFrames += 1
		}
	}

	for (const targetOffset of trace.seekOffsets) {
		const issuedAt = now()
		adapter.writeOffset(targetOffset)
		const deadline = issuedAt + VIRTUAL_LIST_BENCH_MAX_SETTLE_MS
		let reached = false
		let polls = 0
		let previousOffset: number | null = null
		let stablePolls = 0
		let measuredLatency: number | null = null
		let lastSnapshot = adapter.read()
		while (now() <= deadline) {
			await wait()
			lastSnapshot = adapter.read()
			polls += 1
			recordSnapshot(lastSnapshot, seekCoverage)
			const clampedTarget = Math.max(
				0,
				Math.min(targetOffset, VIRTUAL_LIST_BENCH_TOTAL_HEIGHT - lastSnapshot.viewportHeight),
			)

			stablePolls =
				previousOffset !== null && Math.abs(lastSnapshot.offset - previousOffset) <= 2
					? stablePolls + 1
					: 0

			previousOffset = lastSnapshot.offset
			if (
				Math.abs(lastSnapshot.offset - clampedTarget) <= VIRTUAL_LIST_BENCH_STEP_UNITS &&
				stablePolls >= 1 &&
				rowsReadyForOffset(lastSnapshot, lastSnapshot.offset)
			) {
				reached = true
				measuredLatency = now() - issuedAt
				seekLatencySamples.push(measuredLatency)
				break
			}
		}

		if (!reached) {
			seekTimeouts += 1
			seekTimeoutOffsets.push(targetOffset)
		}

		const expectedRange = virtualListBenchVisibleRange(
			Math.max(
				0,
				Math.min(targetOffset, VIRTUAL_LIST_BENCH_TOTAL_HEIGHT - lastSnapshot.viewportHeight),
			),
			lastSnapshot.viewportHeight,
		)

		seekResults.push({
			requestedOffset: targetOffset,
			actualOffset: Number(lastSnapshot.offset.toFixed(2)),
			offsetError: Number(Math.abs(lastSnapshot.offset - targetOffset).toFixed(2)),
			viewportHeight: lastSnapshot.viewportHeight,
			mountedCount: lastSnapshot.mountedIndices.length,
			mountedRange: lastSnapshot.mountedIndices.length
				? [Math.min(...lastSnapshot.mountedIndices), Math.max(...lastSnapshot.mountedIndices) + 1]
				: null,
			expectedVisibleRange: [expectedRange.start, expectedRange.end],
			polls,
			latencyMs: measuredLatency === null ? null : Number(measuredLatency.toFixed(2)),
			status: reached ? 'ready' : 'timeout',
		})
	}

	heartbeatStopped = true
	if (heartbeatTimer !== undefined) {clearTimeout(heartbeatTimer)}
	const finishedAt = now()

	return {
		schema: 'octane-xplat.virtual-list-profile.v1',
		target: adapter.target,
		fixture: {
			rowCount: VIRTUAL_LIST_BENCH_ROW_COUNT,
			rowHeightPattern: '32 + (index % 5) * 8',
			totalContentHeight: VIRTUAL_LIST_BENCH_TOTAL_HEIGHT,
		},
		trace: {
			direction: 'forward-reverse-plus-deep-seeks',
			streamFrames: trace.streamOffsets.length,
			deepSeekCount: trace.seekOffsets.length,
			stepsPerDirection: VIRTUAL_LIST_BENCH_STEPS_PER_DIRECTION,
			intervalMs: VIRTUAL_LIST_BENCH_INTERVAL_MS,
			stepUnits: VIRTUAL_LIST_BENCH_STEP_UNITS,
			streamRange: trace.streamRange,
			seekOffsets: trace.seekOffsets,
		},
		viewportHeight: first.viewportHeight,
		durationMs: Number((finishedAt - startedAt).toFixed(2)),
		streamFrameIntervalMs: summarize(streamIntervalSamples),
		stream: {
			frames: trace.streamOffsets.length,
			laggedFrames: laggedStreamFrames,
			readyFrames: trace.streamOffsets.length - laggedStreamFrames,
		},
		deepSeekLatencyMs: {
			...summarize(seekLatencySamples),
			timeouts: seekTimeouts,
			timeoutOffsets: seekTimeoutOffsets,
			results: seekResults,
		},
		mountedRows: summarize(mountedSamples),
		visibleCoverage: {
			samples: coverageSamples,
			gapSamples: visibleGapSamples,
			maxMissingVisibleRows,
			missingVisibleRowsAcrossSamples: missingVisibleRows,
			maxGapUnits: Number(maxVisibleGap.toFixed(2)),
			stream: streamCoverage,
			deepSeeks: seekCoverage,
		},
		rowChurn: { mounted: mountedRowsAdded, unmounted: mountedRowsRemoved },
		eventLoopTimerDriftMs: summarize(eventLoopDriftSamples),
		measurementNotes: [
			'Rows mounted and unmounted are identity-set changes observed while polling; they are not native allocation timings.',
			'The stream reports missed 16 ms offset checkpoints and visible geometry; deep-seek latency includes 16 ms polling and mounted-row readiness.',
			'Timer drift and checkpoint intervals are JavaScript responsiveness proxies; they do not measure display frame pacing or vsync.',
			'This scripted offset stream does not reproduce trackpad, wheel, or touch gesture physics.',
		],
	}
}
