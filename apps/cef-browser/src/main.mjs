import { createAppKitWindow } from './appkit.mjs'
import App from './App.tsrx'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'

const appKit = createAppKitWindow({ title: 'Xplat CEF spike', width: 1024, height: 768 })
const { app, window: mainWindow, contentView, applicationClosed, windowClosed } = appKit
const root = createMacOSRoot(contentView)
let rootUnmounted = false

function unmountMainRoot() {
	if (rootUnmounted) {
		return
	}

	rootUnmounted = true
	try {
		root.unmount()
	} catch (error) {
		console.error('[cef-spike] root unmount failed', error)
	}
}

root.render(App, { parentWindow: mainWindow })
console.log('[cef-spike] component rendered')

void windowClosed.then(unmountMainRoot)
void applicationClosed.then(() => {
	unmountMainRoot()
	mainWindow.delegate = null
	mainWindow.close()
	app.delegate = null
	globalThis.__xplatStopHost?.()
})

if (process.env.OCTANE_MACOS_EXTERNAL_RUNLOOP === '1') {
	app.finishLaunching()
	app.activateIgnoringOtherApps(true)
} else {
	app.run()
}
