import { build } from 'vite'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'
import { hmrUniversalComponent, UNIVERSAL_HMR } from 'octane/universal/native'
import { createAppKitWindow } from '../src/appkit.mjs'
import { createMacOSRoot } from '../src/renderer/index.mjs'

const configFile = new URL('../vite.dev.config.mjs', import.meta.url).pathname
const bundleFile = new URL('../dist/app.js', import.meta.url).pathname
let appKit
let root
let liveComponent
let watcher

try {
	await build({ configFile, mode: 'development' })
	appKit = createAppKitWindow()
	const { app, window, contentView, closed } = appKit
	root = createMacOSRoot(contentView)
	if (process.env.OCTANE_MACOS_AUTOMATION === '1') {
		const input = createInterface({ input: process.stdin })
		input.on('line', (line) => {
			const command = line.trim()
			try {
				if (command.startsWith('press ')) {root.__macosDebug.pressButton(command.slice(6))}
				else if (command.startsWith('tap ')) {
					root.__macosDebug.pressAccessibilityLabel(command.slice(4))
				} else if (command !== 'snapshot') {
					throw new Error('Use tap <accessibility label>, press <button title>, or snapshot')
				}

				setTimeout(() => {
					console.log('[macos-automation] ' + JSON.stringify(root.__macosDebug.snapshot()))
				}, 0)
			} catch (error) {
				console.error('[macos-automation] command failed', error)
			}
		})
	}

	const renderApp = async (afterEdit = false) => {
		const module = await import(`${pathToFileURL(bundleFile).href}?v=${Date.now()}`)
		if (!liveComponent) {
			liveComponent = hmrUniversalComponent('macos', module.default)
			root.render(liveComponent, {})
		} else {
			liveComponent[UNIVERSAL_HMR].update(module.default)
			await new Promise((resolve) => setTimeout(resolve, 0))
		}

		console.log('[macos] component rendered' + (afterEdit ? ' after hot edit' : ''))
	}

	await renderApp()

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
	await closed
	await watcher.close()
	root.unmount()
	window.close()
	appKit.delegate = null
} catch (error) {
	await watcher?.close()
	root?.unmount()
	if (appKit) {
		appKit.window.delegate = null
		appKit.app.delegate = null
		appKit.delegate = null
		appKit.window.close()
	}

	throw error
}
