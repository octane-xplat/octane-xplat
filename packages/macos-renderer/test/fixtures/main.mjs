import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import App from './App.macos.tsx'

const app = NSApplication.sharedApplication
app.setActivationPolicy(NSApplicationActivationPolicy.Regular)
const windowStyle = NSWindowStyleMask.Titled | NSWindowStyleMask.Closable
const nativeWindow = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
	{ origin: { x: 0, y: 0 }, size: { width: 400, height: 200 } },
	windowStyle,
	2,
	false,
)

nativeWindow.title = 'Renderer consumer'
nativeWindow.releasedWhenClosed = false
const root = createMacOSRoot(nativeWindow.contentView)
root.render(App, {})
nativeWindow.makeKeyAndOrderFront(app)
app.finishLaunching()

if (process.env.XPLAT_RENDERER_CONSUMER_TEST === '1') {
	setTimeout(() => {
		try {
			const font = root.__macosDebug.findId('count').font
			if (
				Number(font.pointSize) !== 22 ||
				String(font.fontName) !== String(NSFont.systemFontOfSizeWeight(22, 0.4).fontName)
			) {
				throw new Error('Packed consumer lost the weighted system font')
			}

			root.__macosDebug.pressId('increment')
			setTimeout(() => {
				try {
					if (String(root.__macosDebug.findId('count').stringValue) !== '1') {
						throw new Error(
							'Packed consumer signal update failed: ' +
								String(root.__macosDebug.findId('count').stringValue),
						)
					}

					console.log('PACKED_RENDERER_OK')
				} catch (error) {
					console.error('PACKED_RENDERER_FAIL: ' + error.message)
				} finally {
					root.unmount()
					nativeWindow.close()
					globalThis.__xplatStopHost()
				}
			}, 30)
		} catch (error) {
			console.error('PACKED_RENDERER_FAIL: ' + error.message)
			globalThis.__xplatStopHost()
		}
	}, 80)
}

// Embedding apps own window-close delegates and root disposal.
if (process.env.OCTANE_MACOS_EXTERNAL_RUNLOOP !== '1') {
	app.run()
}
