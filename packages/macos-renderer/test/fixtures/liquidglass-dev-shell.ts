import '@nativescript/macos-node-api'
import * as renderer from '@octane-xplat/macos-renderer'
import * as native from 'octane/universal/native'
import * as signals from 'octane/signals'
import * as signalClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'
import { NSApplication, NSView } from '@octane-xplat/platform/macos'

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
let live: any
let retained: any
let child: any
let backdrop: any
let reloaded = false
function reload() {
	const loaded = __hostRunFile(process.env.OCTANE_MACOS_DEV_BUNDLE!)
	if (!live) {
		live = native.hmrUniversalComponent('macos', loaded.default ?? loaded)
		root.render(live, {})
		setTimeout(() => {
			retained = debug.findId('hmr-glass')
			child = debug.findId('glass-revision')
			backdrop = retained.subviews.objectAtIndex(0)
			debug.pressId('advance')
			setTimeout(() => console.log('HMR_CONSUMER_READY'), 80)
		}, 80)
	} else if (!reloaded) {
		reloaded = true
		live[native.UNIVERSAL_HMR].update(loaded.default ?? loaded)
		setTimeout(() => {
			try {
				if (
					debug.findId('hmr-glass') !== retained ||
					debug.findId('glass-revision') !== child ||
					child.superview !== retained ||
					retained.subviews.objectAtIndex(0) !== backdrop ||
					String(child.stringValue) !== 'Second revision1'
				) {
					throw new Error('LiquidGlass HMR lost host, backdrop, child or revised text')
				}

				root.unmount()
				if (retained.superview || child.superview || backdrop.superview) {
					throw new Error('LiquidGlass HMR teardown retained views')
				}

				console.log('PACKED_LIQUIDGLASS_HMR_OK')
				console.log('PACKED_HMR_OK')
			} catch (error) {
				console.error('PACKED_HMR_FAIL: ' + (error as Error).stack)
			}
		}, 120)
	}
}

globalThis.__xplatDev = { reload }
globalThis.__xplatOnInput = (line: string) => {
	if (line === 'reload') {
		reload()
	}
}

reload()
app.finishLaunching()
