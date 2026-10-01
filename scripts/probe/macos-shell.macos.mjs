import '@nativescript/macos-node-api'
import * as native from 'octane/universal/native'
import * as signals from 'octane/signals'
import * as signalsClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'
import * as renderer from '../../apps/macos/src/renderer/index.mjs'
import { createAppKitWindow, fitWindowToContent } from '../../apps/macos/src/appkit.mjs'

globalThis.__xplatDevModules = {
	'octane/universal/native': native,
	'octane/signals': signals,
	'octane/signals/client': signalsClient,
	'octane/internal/client': internal,
	'@xplat/macos/renderer': renderer,
}

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
let running = Promise.resolve()

function adapter() {
	let root
	const find = (id) => root?.__macosDebug.findId(id) ?? null
	const required = (id) => {
		const view = find(id)
		if (!view) {
			throw new Error('Missing probe view: ' + id)
		}

		return view
	}

	return {
		host: appKit,
		identity: 'AppKit/JavaScriptCore',
		interaction: 'appkit-action-dispatch',
		mount(Component, props) {
			root?.unmount()
			root = renderer.createMacOSRoot(appKit.contentView)
			root.render(Component, { ...props, parentWindow: appKit.window })
			fitWindowToContent(appKit.window)
		},
		find,
		press(id) {
			root.__macosDebug.pressId(id)
		},
		setText(id, value) {
			root.__macosDebug.setText(id, value)
		},
		inspect(id) {
			const view = required(id)
			const frame = view.frame
			return {
				text: String(view.stringValue ?? view.string ?? view.title ?? ''),
				value: String(view.stringValue ?? view.string ?? ''),
				frame: frame
					? {
							x: Number(frame.origin.x),
							y: Number(frame.origin.y),
							width: Number(frame.size.width),
							height: Number(frame.size.height),
						}
					: null,
			}
		},
		dispose() {
			root?.unmount()
		},
	}
}

function reload() {
	running = running
		.then(async () => {
			const loaded = __hostRunFile(process.env.OCTANE_MACOS_DEV_BUNDLE)
			await loaded.start(adapter())
		})
		.catch((error) => console.error('[xplat-probe-host-error]', error?.stack ?? String(error)))
}

globalThis.__xplatOnInput = (line) => {
	if (line === 'reload') {
		reload()
	}
}

void appKit.applicationClosed.then(() => globalThis.__xplatStopHost?.())
appKit.app.finishLaunching()
appKit.app.activateIgnoringOtherApps(true)
reload()
