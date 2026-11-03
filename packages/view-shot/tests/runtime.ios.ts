import { Application } from '@nativescript/core'
import { captureRef, captureScreen, releaseCapture, viewShot } from '../src/index'
type Context = {
	assert(name: string, actual: unknown, expected?: unknown): void
	record(name: string, value: unknown): void
	onCleanup(callback: () => void): void
	waitFor<T>(predicate: () => T, options?: { timeout?: number }): Promise<NonNullable<T>>
}

const manager = NSFileManager.defaultManager
function fileBytes(uri: string): NSData {
	const url = NSURL.URLWithString(uri)!
	return NSData.dataWithContentsOfURL(url)!
}

function pngSignature(data: NSData): boolean {
	if (data.length < 8) {
		return false
	}
	return (
		data.subdataWithRange(NSMakeRange(0, 8)).base64EncodedStringWithOptions(0) === 'iVBORw0KGgo='
	)
}

export async function run(ctx: Context) {
	ctx.assert('view capture available', viewShot.capabilities.view, true)
	ctx.assert('screen capture available', viewShot.capabilities.screen, true)
	const window = Application.primaryWindow?.ios?.uiWindow
	ctx.assert('primary window', Boolean(window), true)
	const root = window!.rootViewController!.view
	await ctx.waitFor(() => root.window, { timeout: 15000 })
	// UIWindow.window is nil for the window itself; scene association is the
	// attachment signal for a screen target.
	ctx.assert('window attached to scene', window!.windowScene !== null, true)

	// tmpfile: real file, PNG signature, owned release deletes it.
	const uri = await captureScreen({ format: 'png', result: 'tmpfile' })
	ctx.assert('tmpfile uri', /^file:\/\/.*\.png$/.test(uri), true)
	const url = NSURL.URLWithString(uri)!
	ctx.assert('tmpfile exists', manager.fileExistsAtPath(url.path!), true)
	ctx.assert('tmpfile png signature', pngSignature(fileBytes(uri)), true)
	releaseCapture(uri)
	ctx.assert('release deletes owned file', manager.fileExistsAtPath(url.path!), false)
	releaseCapture('file:///foreign-nothing-owned.png')

	// Capture the mounted root view as base64 png and jpeg.
	const png = await captureRef(root, { format: 'png', result: 'base64' })
	ctx.assert(
		'base64 png signature',
		pngSignature(NSData.alloc().initWithBase64EncodedStringOptions(png, 0)!),
		true,
	)
	const jpeg = await captureRef(root, { format: 'jpg', result: 'data-uri', quality: 0.9 })
	ctx.assert('jpeg data uri prefix', jpeg.startsWith('data:image/jpeg;base64,'), true)

	// Explicit output dimensions and the CALayer render strategy both work.
	const scaled = await captureRef(root, {
		format: 'png',
		result: 'base64',
		width: 32,
		height: 32,
	})
	ctx.assert('scaled capture', scaled.length > 100, true)
	const layerRendered = await captureRef(root, {
		format: 'png',
		result: 'base64',
		useRenderInContext: true,
	})
	ctx.assert('renderInContext capture', layerRendered.length > 100, true)

	// A protected web surface is refused when WebKit is linked.
	if (NSClassFromString('WKWebView')) {
		const host = WKWebView.alloc().initWithFrame(CGRectMake(0, 0, 10, 10))
		root.addSubview(host)
		try {
			let refused = ''
			await captureRef(root, { format: 'png', result: 'base64' }).catch((error: Error) => {
				refused = error.message
			})

			ctx.assert(
				'protected surface refused',
				refused,
				'Web/video/GPU surfaces are outside this capture subset',
			)
		} finally {
			host.removeFromSuperview()
		}
	} else {
		ctx.record('protected surface', 'WKWebView unavailable; WebKit not linked')
	}

	// Validation and subset errors stay visible.
	const detached = UIView.alloc().initWithFrame(CGRectMake(0, 0, 10, 10))
	await captureRef(detached, { format: 'png', result: 'base64' }).then(
		() => ctx.assert('detached refusal', 'no error', 'View is detached'),
		(error: Error) => ctx.assert('detached refusal', error.message, 'View is detached'),
	)
	await captureRef(root, { format: 'webp' }).then(
		() => ctx.assert('webp refusal', 'no error', 'unavailable'),
		(error: Error) =>
			ctx.assert('webp refusal', /strategy.*subset|unavailable/i.test(error.message), true),
	)
}
