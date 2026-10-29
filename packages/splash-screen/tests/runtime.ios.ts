import { Application, File, Label, Page, knownFolders, path } from '@nativescript/core'
import * as Splash from '../src/index'

const folder = knownFolders.documents().path
const requestFile = File.fromPath(path.join(folder, 'splash-request.json'))
const request = JSON.parse(requestFile.readTextSync()) as { mode: string; nonce: string }
const bridge = (globalThis as any).XplatSplashScreen
const results: string[] = []
const windows: unknown[] = []
const visibleName = (globalThis as any).UIWindowDidBecomeVisibleNotification
Application.ios.addNotificationObserver(visibleName, (notification) => {
	const window = notification.object as UIWindow
	windows.push({
		name: String(visibleName),
		level: window.windowLevel,
		root: !!window.rootViewController,
		hidden: window.hidden,
	})
})
const state = () => JSON.parse(bridge.state())
const record = (error?: unknown) =>
	File.fromPath(path.join(folder, 'splash-result.json')).writeTextSync(
		JSON.stringify({
			nonce: request.nonce,
			mode: request.mode,
			passed: !error,
			checks: results,
			state: bridge ? state() : null,
			message: error ? String(error) : null,
			windows,
		}),
	)
const assert = (condition: unknown, message: string) => {
	if (!condition) {
		throw new Error(message)
	}
	results.push(message)
}
const wait = (milliseconds: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
let held: Promise<boolean> | undefined
try {
	assert(bridge, 'native plugin class discovered from the installed package')
	assert(Splash.SplashScreen.capabilities.hold, 'configured launch storyboard available')
	if (request.mode !== 'late') {
		Splash.setOptions({ duration: 60, fade: request.mode === 'manual' })
	}
	if (['manual', 'timeout', 'early-hide'].includes(request.mode)) {
		held = Splash.preventAutoHideAsync()
		assert(state().held, 'hold reaches native state synchronously before Application.run')
	}
	if (request.mode === 'early-hide') {
		Splash.hide()
	}
} catch (error) {
	record(error)
	throw error
}

const page = new Page()
const label = new Label()
label.text = 'Splash lifecycle fixture'
page.content = label
let started = false
page.on(Page.loadedEvent, () => {
	if (started) {
		return
	}
	started = true
	void (async () => {
		try {
			if (held) {
				assert(await held, 'early prevention accepted')
			}
			if (request.mode === 'manual') {
				await wait(100)
				assert(
					state().visible && state().held,
					'storyboard remains mounted after the app root loads',
				)
				assert(await Splash.preventAutoHideAsync(), 'repeated prevention shares the same hold')
				const window = Application.ios.window
				const key = window.keyWindow,
					interaction = window.userInteractionEnabled
				assert(
					typeof key === 'boolean' && typeof interaction === 'boolean',
					'window ownership fields are native Boolean properties',
				)
				const overlays = Array.from({ length: window.subviews.count }, (_, i) =>
					window.subviews.objectAtIndex(i),
				).filter((view) => view.accessibilityIdentifier === 'xplat.launch-screen')
				assert(overlays.length === 1, 'exactly one launch storyboard continuation')
				const overlay = overlays[0]
				assert(
					window.subviews.lastObject.isEqual(overlay),
					'launch continuation is above the app root',
				)
				assert(
					overlay.alpha === 1 && !overlay.hidden && overlay.userInteractionEnabled,
					'held continuation is visible and owns interaction',
				)
				assert(
					overlay.frame.size.width === window.bounds.size.width &&
						overlay.frame.size.height === window.bounds.size.height,
					'launch continuation fills the owning window',
				)
				assert(
					(await Splash.hideAsync()) === undefined,
					'hideAsync acknowledges dismissal without an extra result',
				)
				assert(
					['hiding', 'hidden'].includes(state().state),
					'dismissal starts at the native boundary',
				)
				await wait(150)
				assert(state().state === 'hidden' && !state().visible, 'fade removes its storyboard view')
				assert(
					window.keyWindow === key && window.userInteractionEnabled === interaction,
					'dismissal preserves key-window and interaction ownership',
				)
			} else if (request.mode === 'timeout') {
				await wait(100)
				assert(state().visible && state().held, 'native timeout fixture begins held')
				// No JavaScript dismissal occurs in this branch.
				await wait(1300)
				assert(
					state().state === 'hidden' && !state().visible,
					'native backstop releases an abandoned hold',
				)
			} else if (request.mode === 'late') {
				assert(
					(await Splash.preventAutoHideAsync()) === false,
					'a late request cannot re-show a launch screen',
				)
			} else {
				await wait(150)
				assert(
					state().state === 'hidden' && !state().visible,
					request.mode === 'auto'
						? 'default startup auto-hides'
						: 'early hide prevents later attachment',
				)
			}
			assert(
				!state().observers && !state().timeout,
				'startup observers and native timeout are released',
			)
			Splash.hide()
			await Splash.hideAsync()
			assert(
				(await Splash.preventAutoHideAsync()) === false,
				'dismissed startup remains closed after repeated calls',
			)
			record()
		} catch (error) {
			record(error)
		}
	})()
})
Application.run({ create: () => page })
