// VirtualList probes run in the AppKit process so their timing and RSS describe
// the JavaScriptCore host, not Vite's Node watcher.
const env = process.env
const enabled = env.OCTANE_MACOS_VLIST_BENCH === '1'
const mode = ['windowed', 'variable'].includes(env.OCTANE_MACOS_VLIST_MODE)
	? env.OCTANE_MACOS_VLIST_MODE : 'all'
const interactive = env.OCTANE_MACOS_VLIST_INTERACTIVE === '1'
const requestedCount = Number(env.OCTANE_MACOS_VLIST_COUNT)

if (env.OCTANE_MACOS_PARITY_ONLY === '1') globalThis.__xplatMacOSParityOnly = true
if (enabled) {
	globalThis.__xplatMacOSVirtualListCount = Number.isSafeInteger(requestedCount) && requestedCount > 0
		? requestedCount : 500
}

function summarize(values) {
	if (!values.length) return { samples: 0, p50Ms: null, p95Ms: null, p99Ms: null, maxMs: null }
	const sorted = values.slice().sort((a, b) => a - b)
	const percentile = (fraction) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)]
	const round = (value) => Number(value.toFixed(2))
	return {
		samples: sorted.length,
		p50Ms: round(percentile(0.5)),
		p95Ms: round(percentile(0.95)),
		p99Ms: round(percentile(0.99)),
		maxMs: round(sorted.at(-1)),
	}
}

export function createDevBench(root, appKit) {
	if (!enabled) return { beforeRender() {}, afterRender() {}, onInput() { return false } }
	let renderStartedAt = 0
	let renderMetricsBefore
	let initialRenderMs = 0
	let initialRenderCpuMs = 0
	let initialRenderRssDeltaMiB = 0
	let heartbeatTimer
	let heartbeatStartedAt = 0
	const heartbeatTimes = []
	const metrics = () => __hostMetrics()
	const finish = () => { clearInterval(heartbeatTimer); appKit.app.terminate(null) }

	function result() {
		const current = root.__macosDebug.metrics()
		const scrollEvents = root.__macosDebug.scrollStats('vlist-bench').events ?? []
		const offsetDeltas = scrollEvents.slice(1).map((event, index) =>
			event.verticalOffset - scrollEvents[index].verticalOffset)
		const heartbeatIntervals = heartbeatTimes.slice(1).map((time, index) => time - heartbeatTimes[index])
		return {
			mode: 'variable-windowed',
			items: globalThis.__xplatMacOSVirtualListCount,
			input: env.OCTANE_MACOS_VLIST_INPUT ?? 'unspecified',
			expectedContentHeight: globalThis.__xplatMacOSVirtualListScrollProbe?.totalContentHeight ?? null,
			initialRenderMs: Number(initialRenderMs.toFixed(1)),
			initialRenderRssDeltaMiB: Number(initialRenderRssDeltaMiB.toFixed(1)),
			elapsedMs: Number((performance.now() - heartbeatStartedAt).toFixed(1)),
			current,
			scrollEvents: {
				count: scrollEvents.length,
				offsetStart: scrollEvents[0]?.verticalOffset ?? null,
				offsetEnd: scrollEvents.at(-1)?.verticalOffset ?? null,
				maxOffset: scrollEvents.reduce((max, event) => Math.max(max, event.verticalOffset), 0),
				callbackMs: summarize(scrollEvents.map((event) => event.callbackMs)),
				afterEventMs: summarize(scrollEvents.map((event) => event.afterEventMs).filter(Number.isFinite)),
				rowWindow: {
					peak: scrollEvents.reduce((max, event) => Math.max(max, event.mountedRows ?? 0), 0),
					final: scrollEvents.at(-1)?.mountedRows ?? null,
				},
				absoluteOffsetDeltaPt: Math.round(offsetDeltas.reduce((sum, delta) => sum + Math.abs(delta), 0)),
			},
			rangeCommitMs: summarize(globalThis.__xplatMacOSVirtualListScrollProbe?.rangeCommitMs ?? []),
			mainLoopHeartbeatMs: {
				...summarize(heartbeatIntervals),
				intervalsOver16_7ms: heartbeatIntervals.filter((value) => value > 16.7).length,
				intervalsOver33_3ms: heartbeatIntervals.filter((value) => value > 33.3).length,
			},
		}
	}

	return {
		beforeRender() {
			renderStartedAt = performance.now()
			renderMetricsBefore = metrics()
		},
		afterRender() {
			setTimeout(() => {
				const after = metrics()
				initialRenderMs = performance.now() - renderStartedAt
				initialRenderCpuMs = after.cpuMs - renderMetricsBefore.cpuMs
				initialRenderRssDeltaMiB = (after.rssBytes - renderMetricsBefore.rssBytes) / 1024 / 1024
				setTimeout(() => {
					if (interactive) {
						heartbeatStartedAt = performance.now()
						heartbeatTimes.push(heartbeatStartedAt)
						heartbeatTimer = setInterval(() => heartbeatTimes.push(performance.now()), 16)
						console.log('[macos-vlist-ready] ' + JSON.stringify({
							mode: 'variable-windowed',
							items: globalThis.__xplatMacOSVirtualListCount,
							initial: root.__macosDebug.metrics(),
						}))
						return
					}
						void (async () => {
							try {
								const initial = root.__macosDebug.metrics()
								let requestedScrollOffset = null
								let actualScrollOffset = null
								let afterScroll = null
								if (mode === 'windowed') {
									const scrollView = initial.scrollViews.find((view) => view.id === 'vlist-bench')
									requestedScrollOffset = Math.max(0, scrollView.contentHeight - scrollView.viewportHeight)
									actualScrollOffset = root.__macosDebug.scrollToId('vlist-bench', requestedScrollOffset)
									await new Promise((resolve) => setTimeout(resolve, 150))
									afterScroll = root.__macosDebug.metrics()
								}
								console.log('[macos-vlist-bench] ' + JSON.stringify({
									mode, items: globalThis.__xplatMacOSVirtualListCount,
									initialRenderMs, initialRenderCpuMs, initialRenderRssDeltaMiB,
									initialRenderHeapDeltaMiB: null,
									rssMiB: Number((metrics().rssBytes / 1024 / 1024).toFixed(1)),
									heapUsedMiB: null,
									requestedScrollOffset, actualScrollOffset, initial, afterScroll,
								}))
							} catch (error) { console.error('[macos-vlist-bench] failed', error) }
							finally { finish() }
						})()
					}, 500)
			}, 0)
		},
		onInput(command) {
			if (interactive && command === 'scroll-stream') {
				void (async () => {
					try {
						const count = Number(env.OCTANE_MACOS_VLIST_EVENTS ?? 180)
						const scrollView = root.__macosDebug.metrics().scrollViews.find((view) => view.id === 'vlist-bench')
						const contentHeight = Number(scrollView?.contentHeight ??
							globalThis.__xplatMacOSVirtualListScrollProbe?.totalContentHeight ?? 0)
						const maxOffset = Math.max(0, contentHeight - (scrollView?.viewportHeight ?? 0))
						for (let index = 1; index <= count; index++) {
							root.__macosDebug.scrollToId('vlist-bench', Math.min(index * 8, maxOffset))
							await new Promise((resolve) => setTimeout(resolve, 16))
						}
						root.__macosDebug.scrollToId('vlist-bench', maxOffset / 2)
						await new Promise((resolve) => setTimeout(resolve, 100))
						root.__macosDebug.scrollToId('vlist-bench', maxOffset)
						await new Promise((resolve) => setTimeout(resolve, 250))
						console.log('[macos-vlist-result] ' + JSON.stringify(result()))
					} catch (error) { console.error('[macos-vlist-bench] scroll stream failed', error) }
					finally { finish() }
				})()
				return true
			}
			if (interactive && (command === 'metrics' || command === 'finish')) {
				setTimeout(() => {
					console.log('[macos-vlist-result] ' + JSON.stringify(result()))
					if (command === 'finish') finish()
				}, 100)
				return true
			}
			return false
		},
	}
}
