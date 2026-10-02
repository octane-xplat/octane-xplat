import { harnessFontOptions } from './fonts.mjs'
import { createAppKitWindow, fitWindowToContent } from './appkit.mjs'
import App from './App.tsx'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
const { app, window: mainWindow, contentView, applicationClosed, windowClosed } = appKit
const root = createMacOSRoot(contentView, harnessFontOptions)
let rootUnmounted = false

function unmountMainRoot() {
	if (rootUnmounted) {
		return
	}

	rootUnmounted = true
	try {
		root.unmount()
	} catch (error) {
		console.error('[macos] main window root unmount failed', error)
	}
}

root.render(App, { parentWindow: mainWindow })
fitWindowToContent(mainWindow)
console.log('[macos-bundle] component rendered')

void windowClosed.then(unmountMainRoot)
void applicationClosed.then(() => {
	unmountMainRoot()
	mainWindow.delegate = null
	mainWindow.close()
	app.delegate = null
	appKit.delegate = null
	globalThis.__xplatStopHost?.()
})

if (process.env.OCTANE_MACOS_EXTERNAL_RUNLOOP === '1') {
	app.finishLaunching()
	app.activateIgnoringOtherApps(true)
} else {
	app.run()
}
