import { createAppKitWindow } from './appkit.mjs'
import App from './App.tsx'
import { createMacOSRoot } from './renderer/index.mjs'

const appKit = createAppKitWindow()
const { app, window, contentView, closed } = appKit
const root = createMacOSRoot(contentView)
root.render(App, {})
console.log('[macos-bundle] component rendered')

void closed.then(() => {
	root.unmount()
	window.close()
	appKit.delegate = null
})
app.run()
