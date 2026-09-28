import { build } from 'vite'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'
import { hmrUniversalComponent, UNIVERSAL_HMR } from 'octane/universal/native'
import { createAppKitWindow, debugWindows } from '../src/appkit.mjs'
import { createMacOSRoot } from '../src/renderer/index.mjs'

const configFile = new URL('../vite.dev.config.mjs', import.meta.url).pathname
const bundleFile = new URL('../dist/app.js', import.meta.url).pathname
let appKit
let root
let liveComponent
let watcher
let mainWindowClosed = false
let mainRootUnmounted = false
let initialRenderMs = null
let initialRenderCpuMs = null
let initialRenderRssDeltaMiB = null
let initialRenderHeapDeltaMiB = null
const listBench = process.env.OCTANE_MACOS_VLIST_BENCH === '1'
const listBenchMode = process.env.OCTANE_MACOS_VLIST_MODE === 'windowed' ? 'windowed' : 'all'
const listBenchCount = Number(process.env.OCTANE_MACOS_VLIST_COUNT)

if (listBench) {
	globalThis.__xplatMacOSVirtualListCount = Number.isSafeInteger(listBenchCount) && listBenchCount > 0
		? listBenchCount
		: 500
}

function unmountMainRoot() {
	mainWindowClosed = true
	if (!root || mainRootUnmounted) {
		return
	}

	mainRootUnmounted = true
	try {
		root.unmount()
	} catch (error) {
		console.error('[macos] main window root unmount failed', error)
	}
}

try {
	await build({ configFile, mode: 'development' })
	appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
	const { app, window, contentView, applicationClosed, windowClosed } = appKit
	root = createMacOSRoot(contentView)
	void windowClosed.then(unmountMainRoot)
	if (process.env.OCTANE_MACOS_AUTOMATION === '1') {
		const input = createInterface({ input: process.stdin })
		input.on('line', (line) => {
			const command = line.trim()
			try {
				if (command.startsWith('press ')) {
					root.__macosDebug.pressButton(command.slice(6))
				} else if (command.startsWith('tap ')) {
					const label = command.slice(4)
					const targets = [root.__macosDebug, ...debugWindows().map((w) => w.debug)]
					let handled = false
					for (const target of targets) {
						if (!target) {
							continue
						}

						try {
							target.pressAccessibilityLabel(label)
							handled = true
							break
						} catch {}
					}

					if (!handled) {
						throw new Error('No AppKit pressable labeled ' + label)
					}
				} else if (command !== 'snapshot') {
					throw new Error('Use tap <accessibility label>, press <button title>, or snapshot')
				}

				setTimeout(() => {
					console.log(
						'[macos-automation] ' +
							JSON.stringify({
								main: root.__macosDebug.snapshot(),
								windows: debugWindows().map((w) => ({
									title: w.title,
									...w.debug?.snapshot(),
								})),
							}),
					)
				}, 0)
			} catch (error) {
				console.error('[macos-automation] command failed', error)
			}
		})
	}

	const renderApp = async (afterEdit = false) => {
		if (mainWindowClosed) {
			return
		}

		const renderStartedAt = performance.now()
		const renderMemoryBefore = listBench && !afterEdit ? process.memoryUsage() : null
		const renderCpuBefore = listBench && !afterEdit ? process.cpuUsage() : null
		const module = await import(`${pathToFileURL(bundleFile).href}?v=${Date.now()}`)
		if (mainWindowClosed) {
			return
		}

		if (!liveComponent) {
			liveComponent = hmrUniversalComponent('macos', module.default)
			root.render(liveComponent, { parentWindow: appKit.window })
		} else {
			liveComponent[UNIVERSAL_HMR].update(module.default)
			await new Promise((resolve) => setTimeout(resolve, 0))
		}
		if (listBench && !afterEdit) {await new Promise((resolve) => setTimeout(resolve, 0))}
		if (listBench && !afterEdit) {
			const renderMemoryAfter = process.memoryUsage()
			const renderCpu = process.cpuUsage(renderCpuBefore)
			initialRenderMs = performance.now() - renderStartedAt
			initialRenderCpuMs = (renderCpu.user + renderCpu.system) / 1000
			initialRenderRssDeltaMiB = (renderMemoryAfter.rss - renderMemoryBefore.rss) / 1024 / 1024
			initialRenderHeapDeltaMiB = (renderMemoryAfter.heapUsed - renderMemoryBefore.heapUsed) / 1024 / 1024
		}

		console.log('[macos] component rendered' + (afterEdit ? ' after hot edit' : ''))
	}

	await renderApp()
	if (listBench) {
		setTimeout(() => {
			void (async () => {
				try {
					const initial = root.__macosDebug.metrics()
					let requestedScrollOffset = null
					let actualScrollOffset = null
					let afterScroll = null
					if (listBenchMode === 'windowed') {
						requestedScrollOffset = Math.max(0, (globalThis.__xplatMacOSVirtualListCount - 10) * 44)
						actualScrollOffset = root.__macosDebug.scrollToId('vlist-bench', requestedScrollOffset)
						await new Promise((resolve) => setTimeout(resolve, 150))
						afterScroll = root.__macosDebug.metrics()
					}
					console.log('[macos-vlist-bench] ' + JSON.stringify({
						mode: listBenchMode,
						items: globalThis.__xplatMacOSVirtualListCount,
						initialRenderMs: Number(initialRenderMs?.toFixed(1) ?? 0),
						initialRenderCpuMs: Number(initialRenderCpuMs?.toFixed(1) ?? 0),
						initialRenderRssDeltaMiB: Number(initialRenderRssDeltaMiB?.toFixed(1) ?? 0),
						initialRenderHeapDeltaMiB: Number(initialRenderHeapDeltaMiB?.toFixed(1) ?? 0),
						rssMiB: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(1)),
						heapUsedMiB: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)),
						requestedScrollOffset,
						actualScrollOffset,
						initial,
						afterScroll,
					}))
				} catch (error) {
					console.error('[macos-vlist-bench] failed', error)
				} finally {
					appKit.app.terminate(null)
				}
			})()
		}, 500)
	}

	watcher = await build({ configFile, mode: 'development', build: { watch: {} } })
	let firstBundle = true
	let resolveWatcherReady
	let rejectWatcherReady
	const watcherReady = new Promise((resolve, reject) => {
		resolveWatcherReady = resolve
		rejectWatcherReady = reject
	})

	watcher.on('event', (event) => {
		if (event.code === 'BUNDLE_END') {
			if (firstBundle) {
				firstBundle = false
				resolveWatcherReady()
				return
			}

			void renderApp(true).catch((error) => console.error('[macos] hot update failed', error))
		} else if (event.code === 'ERROR') {
			console.error('[macos] rebuild failed; the last good component is still mounted', event.error)
			if (firstBundle) {rejectWatcherReady(event.error)}
		}
	})

	await watcherReady
	console.log('[macos] AppKit window ready; Octane HMR is watching src/App.tsx')
	app.run()
	await applicationClosed
	await watcher.close()
	unmountMainRoot()
	window.delegate = null
	window.close()
	app.delegate = null
	appKit.delegate = null
} catch (error) {
	await watcher?.close()
	unmountMainRoot()
	if (appKit) {
		appKit.window.delegate = null
		appKit.app.delegate = null
		appKit.delegate = null
		appKit.window.close()
	}

	throw error
}
