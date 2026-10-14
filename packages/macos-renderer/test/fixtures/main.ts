import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { checkFormattedLifecycle } from './formatted-lifecycle'
import { checkSearchLifecycle } from './search-lifecycle'
import { checkRootLifecycle } from './root-lifecycle'
import { checkProxyLifecycle } from './proxy-lifecycle'
import { checkWrapLifecycle } from './wrap-lifecycle'
import { checkDockLifecycle } from './dock-lifecycle'
import { checkContentLifecycle } from './content-lifecycle'
import App, { childRefs, stackRefs, refEvents, tapEvents } from './App'

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
root.render(App as any, {})
nativeWindow.makeKeyAndOrderFront(app)
app.finishLaunching()

if (process.env.XPLAT_RENDERER_CONSUMER_TEST === '1') {
	const debug = (root as any).__macosDebug
	setTimeout(() => {
		try {
			const font = debug.findId('count').font
			if (
				Number(font.pointSize) !== 22 ||
				String(font.fontName) !== String(NSFont.systemFontOfSizeWeight(22, 0.4).fontName)
			) {
				throw new Error('Packed consumer lost the weighted system font')
			}

			const stack = debug.findId('layout')
			const a = debug.findId('a'),
				b = debug.findId('b'),
				c = debug.findId('c')

			const check = (condition: boolean, message: string) => {
				if (!condition) {
					throw new Error(message)
				}
			}

			const rect = (view: any) => view.alignmentRectForFrame(view.frame)
			const near = (a: number, b: number) => Math.abs(a - b) < 1
			const views = () => {
				const group = stack.viewsInGravity(NSStackViewGravity.Top)
				return Array.from({ length: Number(group.count) }, (_, i) => group.objectAtIndex(i))
			}

			nativeWindow.contentView.layoutSubtreeIfNeeded()
			check(stackRefs.length === 1 && stackRefs[0] === stack, 'Stack ref assignment failed')
			check(childRefs.a.current === a, 'Object ref assignment failed')
			check(
				stack.orientation === NSUserInterfaceLayoutOrientation.Vertical,
				'Default orientation failed',
			)

			check(stack.spacing === 0 && stack.edgeInsets.left === 8, 'Default gap/padding failed')
			check(
				near(stack.frame.size.width, 240) && near(stack.frame.size.height, 80),
				'Explicit layout size failed',
			)

			check(views()[0] === a && views()[1] === b && views()[2] === c, 'Initial child order failed')
			check(near(rect(a).origin.x, 100), 'Centered vertical child failed')
			check(near(rect(b).origin.x, 8), 'Leading padding failed')
			const top = (view: any) =>
				Number(stack.frame.size.height) -
				Number(rect(view).origin.y) -
				Number(rect(view).size.height)

			check(top(a) < top(b) && top(b) < top(c), 'Vertical placement failed')
			debug.pressId('increment')
			setTimeout(() => {
				try {
					if (String(debug.findId('count').stringValue) !== '1') {
						throw new Error(
							'Packed consumer signal update failed: ' + String(debug.findId('count').stringValue),
						)
					}

					nativeWindow.contentView.layoutSubtreeIfNeeded()
					check(
						debug.findId('layout') === stack && stackRefs.length === 1,
						'Orientation recreated the host',
					)

					check(
						stack.orientation === NSUserInterfaceLayoutOrientation.Horizontal,
						'Reactive orientation failed',
					)

					check(views()[0] === c && views()[1] === a && views()[2] === b, 'Keyed child move failed')
					check(
						childRefs.a.current === a && childRefs.b.current === b && childRefs.c.current === c,
						'Moved refs changed identity',
					)

					check(
						rect(c).origin.x < rect(a).origin.x && rect(a).origin.x < rect(b).origin.x,
						'Horizontal placement failed',
					)

					check(near(rect(a).origin.y, 32), 'Centered horizontal child failed')
					debug.pressId('layout')
					check(tapEvents.join(',') === 'tap:true', 'Reactive shared tap payload failed')
					debug.pressId('increment')
					setTimeout(async () => {
						try {
							nativeWindow.contentView.layoutSubtreeIfNeeded()
							check(
								stack.orientation === NSUserInterfaceLayoutOrientation.Vertical,
								'Removed orientation did not restore default',
							)

							check(views().length === 0, 'Removed children remain arranged')
							debug.pressId('layout')
							check(tapEvents.length === 1, 'Removed tap handler remained active')
							check(
								Object.values(childRefs).every((ref) => ref.current == null),
								'Object refs were not cleared',
							)

							check(
								!a.superview && !b.superview && !c.superview,
								'Detached children retained a parent',
							)

							root.unmount()
							check(refEvents.join(',') === 'attach,cleanup', 'Callback ref cleanup failed')
							check(!stack.superview, 'Unmount retained the native stack')
							console.log('PACKED_STACKLAYOUT_OK')
							const contentRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkContentLifecycle(contentRoot, nativeWindow)
							} finally {
								contentRoot.unmount()
							}

							const dockRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkDockLifecycle(dockRoot, nativeWindow)
							} finally {
								dockRoot.unmount()
							}

							const wrapRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkWrapLifecycle(wrapRoot, nativeWindow)
							} finally {
								wrapRoot.unmount()
							}

							const proxyRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkProxyLifecycle(proxyRoot, nativeWindow)
							} finally {
								proxyRoot.unmount()
							}

							const rootLayoutRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkRootLifecycle(rootLayoutRoot, nativeWindow)
							} finally {
								rootLayoutRoot.unmount()
							}

							const searchRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkSearchLifecycle(searchRoot, nativeWindow)
							} finally {
								searchRoot.unmount()
							}

							const formattedRoot = createMacOSRoot(nativeWindow.contentView)
							try {await checkFormattedLifecycle(formattedRoot, nativeWindow)} finally {formattedRoot.unmount()}

							console.log('PACKED_RENDERER_OK')
						} catch (error) {
							console.error('PACKED_RENDERER_FAIL: ' + (error as Error).message)
						} finally {
							root.unmount()
							nativeWindow.close()
							globalThis.__xplatStopHost()
						}
					}, 30)
				} catch (error) {
					console.error('PACKED_RENDERER_FAIL: ' + (error as Error).message)
					root.unmount()
					nativeWindow.close()
					globalThis.__xplatStopHost()
				}
			}, 30)
		} catch (error) {
			console.error('PACKED_RENDERER_FAIL: ' + (error as Error).message)
			globalThis.__xplatStopHost()
		}
	}, 80)
}

// Embedding apps own window-close delegates and root disposal.
if (process.env.OCTANE_MACOS_EXTERNAL_RUNLOOP !== '1') {
	app.run()
}
