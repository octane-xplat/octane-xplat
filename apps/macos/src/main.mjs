import { createAppKitWindow } from './appkit.mjs'
import App from './App.tsx'
import { createMacOSRoot } from './renderer/index.mjs'

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
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
		console.error('[macos] main window root unmount failed', error)
	}
}

root.render(App, { parentWindow: mainWindow })
console.log('[macos-bundle] component rendered')

void windowClosed.then(unmountMainRoot)
void applicationClosed.then(() => {
	unmountMainRoot()
	mainWindow.delegate = null
	mainWindow.close()
	app.delegate = null
	appKit.delegate = null
})

app.run()
