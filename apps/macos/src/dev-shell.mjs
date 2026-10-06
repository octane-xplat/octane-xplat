import { harnessFontOptions } from './fonts'
import '@nativescript/macos-node-api'
import * as octaneNative from 'octane/universal/native'
import * as octaneSignals from 'octane/signals'
import * as octaneSignalsClient from 'octane/signals/client'
import * as octaneInternalClient from 'octane/internal/client'
import * as renderer from '@octane-xplat/macos-renderer'
import { createAppKitWindow, debugWindows, fitWindowToContent } from './appkit'
import { createDevBench } from './dev-bench.mjs'

const { hmrUniversalComponent, UNIVERSAL_HMR } = octaneNative
globalThis.__xplatDevModules = {
	'octane/universal/native': octaneNative,
	'octane/signals': octaneSignals,
	'octane/signals/client': octaneSignalsClient,
	'octane/internal/client': octaneInternalClient,
	'@octane-xplat/macos-renderer': renderer,
}

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
const { app, window, contentView, applicationClosed, windowClosed } = appKit
const root = renderer.createMacOSRoot(contentView, harnessFontOptions)
const bench = createDevBench(root, appKit)
let liveComponent
let closed = false
let unmounted = false

function unmount() {
	closed = true
	if (unmounted) {
		return
	}

	unmounted = true
	try {
		root.unmount()
	} catch (error) {
		console.error('[macos] main window root unmount failed', error)
	}
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
	if (closed) {
		return
	}

	if (!liveComponent) {
		bench.beforeRender()
	}

	const loaded = __hostRunFile(process.env.OCTANE_MACOS_DEV_BUNDLE)
	const component = loaded.default ?? loaded
	if (!component) {
		throw Error('The macOS dev bundle has no default component export')
	}

	if (!liveComponent) {
		liveComponent = hmrUniversalComponent('macos', component)
		root.render(liveComponent, { parentWindow: window })
		fitWindowToContent(window)
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
		if (line === 'reload') {
			return reload(true)
		}

		if (bench.onInput(line)) {
			return
		}

		if (process.env.OCTANE_MACOS_AUTOMATION !== '1') {
			return
		}

		const targets = [root.__macosDebug, ...debugWindows().map((entry) => entry.debug)]
		if (line.startsWith('press ')) {
			root.__macosDebug.pressButton(line.slice(6))
		} else if (line.startsWith('pressid ')) {
			const id = line.slice(8)
			let handled = false
			for (const target of targets) {
				try {
					target?.pressId(id)
					handled = true
					break
				} catch {}
			}

			if (!handled) {
				throw Error('No AppKit pressable with id ' + id)
			}
		} else if (line.startsWith('hover ')) {
			const [id, phase] = line.slice(6).split(' ')
			root.__macosDebug.hover(id, phase ?? 'enter')
		} else if (line === 'popups') {
			console.log(
				'[macos-automation] ' + JSON.stringify({ openPopups: root.__macosDebug.openPopupCount() }),
			)

			return
		} else if (line.startsWith('inspect ')) {
			console.log('[inspect] ' + JSON.stringify(root.__macosDebug.inspect(line.slice(8))))
			return
		} else if (line.startsWith('resize ')) {
			const [width, height] = line.slice(7).split('x').map(Number)
			window.setContentSize({ width, height })
			return
		} else if (line.startsWith('tap ')) {
			const label = line.slice(4)
			let handled = false
			for (const target of targets) {
				try {
					target?.pressAccessibilityLabel(label)
					handled = true
					break
				} catch {}
			}

			if (!handled) {
				throw Error('No AppKit pressable labeled ' + label)
			}
		} else if (line === 'cells') {
			console.log(
				'[parity-cells] ' + JSON.stringify(root.__macosDebug.parityCellFrames('parity-scroll')),
			)

			return
		} else if (line.startsWith('scrolltop ')) {
			const parts = line.slice(10).split(' ')
			const [scrollId, top] =
				parts.length > 1 ? [parts[0], Number(parts[1])] : ['parity-scroll', Number(parts[0])]

			console.log(
				'[scrolled] ' + JSON.stringify({ scrollTop: root.__macosDebug.scrollToTop(scrollId, top) }),
			)

			return
		} else if (line.startsWith('listsnap ')) {
			const snap = root.__macosDebug.listSnapshot(line.slice(9))
			console.log(
				'[listsnap] ' +
					JSON.stringify({
						offset: snap.offset,
						viewportHeight: snap.viewportHeight,
						mounted: snap.mountedIndices.length,
						firstRows: snap.mountedIndices.slice(0, 6),
						lastRows: snap.mountedIndices.slice(-6),
						rowSample: snap.rows.slice(0, 3),
					}),
			)

			return
		} else if (line.startsWith('ancestors ')) {
			console.log('[ancestors] ' + JSON.stringify(root.__macosDebug.ancestors(line.slice(10))))
			return
		} else if (line.startsWith('style ')) {
			const [, styleId, styleName, styleValue] = line.split(' ')
			console.log(
				'[style] ' +
					JSON.stringify(root.__macosDebug.setStyle(styleId, styleName, Number(styleValue))),
			)

			return
		} else if (line.startsWith('frame ')) {
			console.log('[frame] ' + JSON.stringify(root.__macosDebug.frameInWindow(line.slice(6))))
			return
		} else if (line.startsWith('title ')) {
			// Screenshot drivers poll the window title to learn which
			// capture is pending — CUA can't see process-local files.
			window.title = line.slice(6)
			return
		} else if (line !== 'snapshot' && line !== 'parity') {
			throw Error(
				'Use tap <accessibility label>, press <button title>, pressid <id>, hover <id> [enter|exit], popups, snapshot, or parity',
			)
		}

		if (line === 'parity') {
			if (!globalThis.__xplatMacOSRunParity) {
				throw Error('Parity runner is unavailable')
			}

			globalThis.__xplatMacOSRunParity()
			return
		}

		setTimeout(
			() =>
				console.log(
					'[macos-automation] ' +
						JSON.stringify({
							main: root.__macosDebug.snapshot(),
							windows: debugWindows().map((entry) => ({
								title: entry.title,
								...entry.debug?.snapshot(),
							})),
						}),
				),
			0,
		)
	} catch (error) {
		console.error(
			'[macos] dev command failed:',
			`${error?.name ?? 'Error'}: ${error?.message ?? String(error)} @ ${error?.stack ?? 'no stack'}`,
		)
	}
}

reload()
app.finishLaunching()
app.activateIgnoringOtherApps(true)
console.log('[macos] AppKit window ready; Octane HMR is watching src/App.tsx')
