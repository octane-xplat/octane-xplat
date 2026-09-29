import '@nativescript/macos-node-api'
import * as octaneNative from 'octane/universal/native'
import * as octaneSignals from 'octane/signals'
import * as octaneSignalsClient from 'octane/signals/client'
import * as renderer from './renderer/index.mjs'
import { createAppKitWindow, debugWindows } from './appkit.mjs'
import { createDevBench } from './dev-bench.mjs'

const { hmrUniversalComponent, UNIVERSAL_HMR } = octaneNative
globalThis.__xplatDevModules = {
	'octane/universal/native': octaneNative,
	'octane/signals': octaneSignals,
	'octane/signals/client': octaneSignalsClient,
	'@xplat/macos/renderer': renderer,
}

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
const { app, window, contentView, applicationClosed, windowClosed } = appKit
const root = renderer.createMacOSRoot(contentView)
const bench = createDevBench(root, appKit)
let liveComponent
let closed = false
let unmounted = false

function unmount() {
	closed = true
	if (unmounted) return
	unmounted = true
	try { root.unmount() }
	catch (error) { console.error('[macos] main window root unmount failed', error) }
}

void windowClosed.then(unmount)
void applicationClosed.then(() => {
	unmount()
	window.delegate = null
	window.close()
	app.delegate = null
	appKit.delegate = null
	globalThis.__xplatStopHost?.()
})

function reload(afterEdit = false) {
	if (closed) return
	if (!liveComponent) bench.beforeRender()
	const loaded = __hostRunFile(process.env.OCTANE_MACOS_DEV_BUNDLE)
	const component = loaded.default ?? loaded
	if (!component) throw Error('The macOS dev bundle has no default component export')
	if (!liveComponent) {
		liveComponent = hmrUniversalComponent('macos', component)
		root.render(liveComponent, { parentWindow: window })
		bench.afterRender()
	} else {
		liveComponent[UNIVERSAL_HMR].update(component)
	}
	console.log('[macos] component rendered' + (afterEdit ? ' after hot edit' : ''))
}

globalThis.__xplatDev = { reload }
if (process.env.OCTANE_MACOS_PARITY_FIXTURES) {
	globalThis.__xplatParityFixtureFilter = process.env.OCTANE_MACOS_PARITY_FIXTURES.split(',')
}
globalThis.__xplatOnInput = (line) => {
	try {
		if (line === 'reload') return reload(true)
		if (bench.onInput(line)) return
		if (process.env.OCTANE_MACOS_AUTOMATION !== '1') return
		const targets = [root.__macosDebug, ...debugWindows().map((entry) => entry.debug)]
		if (line.startsWith('press ')) root.__macosDebug.pressButton(line.slice(6))
		else if (line.startsWith('pressid ')) {
			const id = line.slice(8)
			let handled = false
			for (const target of targets) {
				try { target?.pressId(id); handled = true; break } catch {}
			}

			if (!handled) {throw Error('No AppKit pressable with id ' + id)}
		}
		else if (line.startsWith('hover ')) {
			const [id, phase] = line.slice(6).split(' ')
			root.__macosDebug.hover(id, phase ?? 'enter')
		}
		else if (line === 'popups') {
			console.log('[macos-automation] ' + JSON.stringify({ openPopups: root.__macosDebug.openPopupCount() }))
			return
		}
		else if (line.startsWith('tap ')) {
			const label = line.slice(4)
			let handled = false
			for (const target of targets) {
				try { target?.pressAccessibilityLabel(label); handled = true; break } catch {}
			}
			if (!handled) throw Error('No AppKit pressable labeled ' + label)
		} else if (line !== 'snapshot' && line !== 'parity')
			throw Error('Use tap <accessibility label>, press <button title>, pressid <id>, hover <id> [enter|exit], popups, snapshot, or parity')
		if (line === 'parity') {
			if (!globalThis.__xplatMacOSRunParity) throw Error('Parity runner is unavailable')
			globalThis.__xplatMacOSRunParity()
			return
		}
		setTimeout(() => console.log('[macos-automation] ' + JSON.stringify({
			main: root.__macosDebug.snapshot(),
			windows: debugWindows().map((entry) => ({ title: entry.title, ...entry.debug?.snapshot() })),
		})), 0)
	} catch (error) { console.error('[macos] dev command failed', error) }
}

reload()
app.finishLaunching()
app.activateIgnoringOtherApps(true)
console.log('[macos] AppKit window ready; Octane HMR is watching src/App.tsx')
