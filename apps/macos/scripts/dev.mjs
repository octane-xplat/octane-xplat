import { build } from 'vite'
import { pathToFileURL } from 'node:url'
import { createAppKitWindow } from '../src/appkit.mjs'
import { createMacOSRoot } from '../src/renderer/index.mjs'

const configFile = new URL('../vite.config.mjs', import.meta.url).pathname
const bundleFile = new URL('../dist/app.js', import.meta.url).pathname
const { app, window, contentView, closed } = createAppKitWindow()
const root = createMacOSRoot(contentView)
let watcher

try {
	await build({ configFile })
	const renderApp = async (afterEdit = false) => {
		const module = await import(`${pathToFileURL(bundleFile).href}?v=${Date.now()}`)
		root.render(module.default, {})
		console.log(`[macos] component rendered${afterEdit ? ' after hot edit' : ''}`)
	}
	await renderApp()

	watcher = await build({ configFile, build: { watch: {} } })
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
			void renderApp(true).catch((error) => console.error('[macos] hot edit failed', error))
		} else if (event.code === 'ERROR') {
			console.error('[macos] rebuild failed', event.error)
			if (firstBundle) rejectWatcherReady(event.error)
		}
	})
	await watcherReady
	console.log('[macos] AppKit window ready; Vite is watching src/App.tsx')
	app.run()
	await closed
	await watcher.close()
	root.unmount()
	window.close()
} catch (error) {
	await watcher?.close()
	root.unmount()
	window.close()
	throw error
}
