import '@nativescript/macos-node-api'
import * as renderer from '@octane-xplat/macos-renderer'
import * as native from 'octane/universal/native'
import * as signals from 'octane/signals'
import * as signalClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'

globalThis.__xplatDevModules = {
	'@octane-xplat/macos-renderer': renderer,
	'octane/universal/native': native,
	'octane/signals': signals,
	'octane/signals/client': signalClient,
	'octane/internal/client': internal,
}

const app = NSApplication.sharedApplication
const hostView = NSView.alloc().initWithFrame({
	origin: { x: 0, y: 0 },
	size: { width: 400, height: 200 },
})

const root = renderer.createMacOSRoot(hostView)
const debug = (root as any).__macosDebug
let liveComponent: any
let retainedLabel: any
let reloaded = false
function reload() {
	const loaded = __hostRunFile(process.env.OCTANE_MACOS_DEV_BUNDLE!)
	if (!liveComponent) {
		liveComponent = native.hmrUniversalComponent('macos', loaded.default ?? loaded)
		root.render(liveComponent, {})
		setTimeout(() => {
			retainedLabel = debug.findId('count')
			debug.pressId('increment')
			console.log('HMR_CONSUMER_READY')
		}, 60)
	} else {
		liveComponent[native.UNIVERSAL_HMR].update(loaded.default ?? loaded)
		setTimeout(() => {
			const label = debug.findId('count')
			const revision = debug.findId('revision')
			if (
				label === retainedLabel &&
				String(label.stringValue) === '1' &&
				String(revision.stringValue) === 'Second revision'
			) {
				console.log('PACKED_HMR_OK')
			} else {
				console.error('PACKED_HMR_FAIL: view, state, or revised text differs')
			}
		}, 60)
	}
}

globalThis.__xplatDev = { reload }
globalThis.__xplatOnInput = (line: string) => {
	if (line === 'reload' && !reloaded) {
		reloaded = true
		reload()
	}
}

reload()
app.finishLaunching()
