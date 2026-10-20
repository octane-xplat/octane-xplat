import { checkActionBarLifecycle } from './actionbar-lifecycle'
import { checkListViewLifecycle } from './listview-lifecycle'
import { checkTabLifecycle, checkImperativeTabLifecycle } from './tab-lifecycle'
import { checkTimeLifecycle } from './time-lifecycle'
import { checkSegmentItemLifecycle } from './segment-item-lifecycle'
import { checkSegmentLifecycle } from './segment-lifecycle'
import { checkProgressLifecycle } from './progress-lifecycle'
import { checkListLifecycle } from './list-lifecycle'
import { checkDateLifecycle } from './date-lifecycle'
import { checkActivityLifecycle } from './activity-lifecycle'
import { checkHtmlLifecycle } from './html-lifecycle'
import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { checkFormattedLifecycle } from './formatted-lifecycle'
import { checkSearchLifecycle } from './search-lifecycle'
import { checkRootLifecycle } from './root-lifecycle'
import { checkProxyLifecycle } from './proxy-lifecycle'
import { checkWrapLifecycle } from './wrap-lifecycle'
import { checkDockLifecycle } from './dock-lifecycle'
import { checkContentLifecycle } from './content-lifecycle'
import { checkPlaceholderLifecycle } from './placeholder-lifecycle'
import { checkLiquidGlassLifecycle } from './liquidglass-lifecycle'
import App, { childRefs, stackRefs, refEvents, tapEvents } from './App'
import {
	NSApplication,
	NSApplicationActivationPolicy,
	NSFont,
	NSWindow,
	NSWindowStyleMask,
} from '@octane-xplat/platform/macos'

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

			// masonview hosts are plain NSViews laid out by Mason, so direction,
			// padding, gap and child order are asserted through child geometry.
			const rect = (view: any) => view.alignmentRectForFrame(view.frame)
			const near = (a: number, b: number) => Math.abs(a - b) < 1
			const left = (view: any) => Number(rect(view).origin.x)
			const top = (view: any) =>
				Number(stack.frame.size.height) -
				Number(rect(view).origin.y) -
				Number(rect(view).size.height)

			nativeWindow.contentView.layoutSubtreeIfNeeded()
			check(stackRefs.length === 1 && stackRefs[0] === stack, 'Stack ref assignment failed')
			check(childRefs.a.current === a, 'Object ref assignment failed')
			check(
				Number(stack.subviews.count) === 3 && [a, b, c].every((view) => view.superview === stack),
				'Children not hosted by the masonview',
			)

			check(
				near(left(b), left(c)) && top(a) < top(b) && top(b) < top(c),
				'Column direction/child order failed',
			)

			check(
				near(top(a), 8) && near(top(b), 24) && near(top(c), 40) && near(left(b), 8),
				'Padding/zero gap failed',
			)

			check(
				near(stack.frame.size.width, 240) && near(stack.frame.size.height, 80),
				'Explicit layout size failed',
			)

			check(near(left(a), 100), 'Centered column child failed')
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
						'Direction change recreated the host',
					)

					check(
						near(top(b), top(c)) && left(c) < left(a) && left(a) < left(b),
						'Reactive row direction/keyed child move failed',
					)

					check(
						near(left(c), 8) && near(left(a), 48) && near(left(b), 88),
						'Row padding/zero gap failed',
					)

					check(
						childRefs.a.current === a && childRefs.b.current === b && childRefs.c.current === c,
						'Moved refs changed identity',
					)

					check(near(rect(a).origin.y, 32), 'Centered row child failed')
					debug.pressId('layout')
					check(tapEvents.join(',') === 'tap:true', 'Reactive shared tap payload failed')
					debug.pressId('increment')
					setTimeout(async () => {
						try {
							nativeWindow.contentView.layoutSubtreeIfNeeded()
							check(Number(stack.subviews.count) === 0, 'Removed children remain hosted')
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

							const placeholderRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkPlaceholderLifecycle(placeholderRoot, nativeWindow)
							} finally {
								placeholderRoot.unmount()
							}

							const actionBarRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkActionBarLifecycle(actionBarRoot, nativeWindow)
							} finally {
								actionBarRoot.unmount()
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
							try {
								await checkFormattedLifecycle(formattedRoot, nativeWindow)
							} finally {
								formattedRoot.unmount()
							}

							const htmlRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkHtmlLifecycle(htmlRoot, nativeWindow)
							} finally {
								htmlRoot.unmount()
							}

							const activityRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkActivityLifecycle(activityRoot, nativeWindow)
							} finally {
								activityRoot.unmount()
							}

							const dateRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkDateLifecycle(dateRoot, nativeWindow)
							} finally {
								dateRoot.unmount()
							}

							const listRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkListLifecycle(listRoot, nativeWindow)
							} finally {
								listRoot.unmount()
							}

							const progressRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkProgressLifecycle(progressRoot, nativeWindow)
							} finally {
								progressRoot.unmount()
							}

							const segmentRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkSegmentLifecycle(segmentRoot, nativeWindow)
							} finally {
								segmentRoot.unmount()
							}

							const itemRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkSegmentItemLifecycle(itemRoot, nativeWindow)
							} finally {
								itemRoot.unmount()
							}

							const timeRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkTimeLifecycle(timeRoot, nativeWindow)
							} finally {
								timeRoot.unmount()
							}

							const liquidGlassRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkLiquidGlassLifecycle(liquidGlassRoot, nativeWindow)
							} finally {
								liquidGlassRoot.unmount()
							}

							const tabRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkTabLifecycle(tabRoot, nativeWindow)
							} finally {
								tabRoot.unmount()
							}

							const tabItemsRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkImperativeTabLifecycle(tabItemsRoot, nativeWindow)
							} finally {
								tabItemsRoot.unmount()
							}

							const listViewRoot = createMacOSRoot(nativeWindow.contentView)
							try {
								await checkListViewLifecycle(listViewRoot, nativeWindow)
							} finally {
								listViewRoot.unmount()
							}

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
