import { Application, NativeWindowEvents, WindowEvents } from '@nativescript/core'
import type { NativeWindow } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { OrientationBackend } from './backend-types'
import { Orientation, OrientationLock } from './types'

interface Policy {
	mask: number
	lock: OrientationLock
}
const masks: readonly number[] = [26, 30, 6, 2, 4, 24, 16, 8] as const
// UIKit interface landscapeLeft=4 and landscapeRight=3, opposite the
// UIDevice sensor constants. Expo retains the interface left/right names.
const bitForOrientation = [0, 2, 4, 16, 8] as const
const policies = new WeakMap<UIWindow, Policy>()
const forwarded = new WeakSet<UIWindow>()
const changed = new Set<() => void>()
function currentWindow() {
	return Application.primaryWindow?.ios?.uiWindow
}
function required(): UIWindow {
	const window = currentWindow()
	if (!window?.windowScene) {
		throw new UnavailabilityError('A primary iOS window scene')
	}
	return window
}
function declaredMask(window: UIWindow | null): number {
	const tablet = window?.traitCollection.userInterfaceIdiom === 2 /* UIUserInterfaceIdiom.pad */
	const bundle = NSBundle.mainBundle
	const array =
		(tablet && bundle.objectForInfoDictionaryKey('UISupportedInterfaceOrientations~ipad')) ||
		bundle.objectForInfoDictionaryKey('UISupportedInterfaceOrientations')
	if (!array) {
		return tablet ? 30 : 26
	}
	const names: Record<string, number> = {
		UIInterfaceOrientationPortrait: 2,
		UIInterfaceOrientationPortraitUpsideDown: 4,
		UIInterfaceOrientationLandscapeLeft: 16,
		UIInterfaceOrientationLandscapeRight: 8,
	}
	let mask = 0
	for (let index = 0; index < array.count; index++) {
		mask |= names[String(array.objectAtIndex(index))] ?? 0
	}
	return mask
}
function configured(window: UIWindow): boolean {
	if (!window.windowScene || Number(UIDevice.currentDevice.systemVersion.split('.')[0]) < 16) {
		return false
	}
	// The app imports this module in its delegate before startup. UIKit
	// invokes the forwarding helper while connecting the primary window.
	return forwarded.has(window)
}
function nativePolicy(window: UIWindow): number {
	const app = UIApplication.sharedApplication
	const delegate = app.delegate
	// UIApplication.supportedInterfaceOrientations(for:) returns app defaults.
	// When a delegate supplies the policy, UIKit uses that callback instead.
	if (forwarded.has(window) && delegate?.applicationSupportedInterfaceOrientationsForWindow) {
		return delegate.applicationSupportedInterfaceOrientationsForWindow(app, window)
	}
	return app.supportedInterfaceOrientationsForWindow(window)
}
function canApply(window: UIWindow, mask: number): boolean {
	if (!configured(window) || !mask || (declaredMask(window) & mask) !== mask) {
		return false
	}
	if (
		window.traitCollection.userInterfaceIdiom === 2 /* UIUserInterfaceIdiom.pad */ &&
		!NSBundle.mainBundle.objectForInfoDictionaryKey('UIRequiresFullScreen')
	) {
		return false
	}
	// This portable subset deliberately excludes upside-down iPhone policies.
	return !(
		window.traitCollection.userInterfaceIdiom === 1 /* UIUserInterfaceIdiom.phone */ && mask & 4
	)
}
function info() {
	const window = required()
	const native = window.windowScene!.interfaceOrientation
	const orientation =
		native === 1
			? Orientation.PORTRAIT_UP
			: native === 2
				? Orientation.PORTRAIT_DOWN
				: native === 3
					? Orientation.LANDSCAPE_RIGHT
					: native === 4
						? Orientation.LANDSCAPE_LEFT
						: Orientation.UNKNOWN
	return {
		orientation,
		horizontalSizeClass: window.traitCollection.horizontalSizeClass,
		verticalSizeClass: window.traitCollection.verticalSizeClass,
	}
}
function refreshControllers(window: UIWindow) {
	let controller = window.rootViewController
	while (controller) {
		controller.setNeedsUpdateOfSupportedInterfaceOrientations()
		controller = controller.presentedViewController
	}
}
async function apply(mask: number, lock: OrientationLock): Promise<void> {
	const window = required()
	if (!canApply(window, mask)) {
		throw new UnavailabilityError(
			'Requested iOS orientation policy: check delegate, Info.plist and full-screen configuration',
		)
	}
	const previous = policies.get(window)
	policies.set(window, { mask, lock })
	try {
		refreshControllers(window)
		await new Promise<void>((resolve, reject) => {
			let finished = false
			let timer: ReturnType<typeof setTimeout> | undefined
			const start = Date.now()
			const finish = (error?: Error) => {
				if (finished) {
					return
				}
				finished = true
				clearTimeout(timer)
				if (error) {
					reject(error)
				} else {
					resolve()
				}
			}
			const poll = () => {
				if (finished) {
					return
				}
				if (window !== currentWindow() || !window.windowScene || window.hidden) {
					return finish(new Error('Primary iOS window detached during orientation request'))
				}
				const actual = window.windowScene.interfaceOrientation
				if (Date.now() - start >= 150 && mask & (1 << actual)) {
					return finish()
				}
				if (Date.now() - start >= 4000) {
					return finish(new Error('iOS did not reach the requested interface orientation'))
				}
				timer = setTimeout(poll, 25)
			}
			window.windowScene!.requestGeometryUpdateWithPreferencesErrorHandler(
				UIWindowSceneGeometryPreferencesIOS.alloc().initWithInterfaceOrientations(mask),
				(error) =>
					finish(new Error(`iOS rejected orientation request: ${error.localizedDescription}`)),
			)
			poll()
		})
		if (nativePolicy(window) !== mask) {
			throw new Error('iOS delegate did not apply the requested orientation mask')
		}
	} catch (error) {
		if (previous) {
			policies.set(window, previous)
		} else {
			policies.delete(window)
		}
		refreshControllers(window)
		throw error
	}
	setTimeout(() => {
		for (const callback of Array.from(changed)) {
			callback()
		}
	}, 0)
}
export const backend: OrientationBackend = {
	capabilities() {
		const window = currentWindow()
		return {
			observe: Boolean(window?.windowScene),
			lock: Boolean(window && canApply(window, declaredMask(window) & 26)),
		}
	},
	info,
	policy() {
		const window = required()
		const mask = nativePolicy(window)
		const owned = policies.get(window)
		if (owned?.mask === mask) {
			return owned.lock
		}
		const index = masks.indexOf(mask as (typeof masks)[number])
		return index < 0 ? OrientationLock.OTHER : (index as OrientationLock)
	},
	platformPolicy() {
		const mask = nativePolicy(required())
		return {
			screenOrientationArrayIOS: ([1, 2, 3, 4] as Orientation[]).filter((value) =>
				Boolean(mask & bitForOrientation[value]),
			),
		}
	},
	supports(lock) {
		const window = currentWindow()
		return Boolean(
			window &&
			canApply(window, lock === OrientationLock.DEFAULT ? declaredMask(window) & 26 : masks[lock]!),
		)
	},
	lock: (lock) =>
		apply(lock === OrientationLock.DEFAULT ? declaredMask(required()) & 26 : masks[lock]!, lock),
	unlock: () => apply(declaredMask(required()) & 26, OrientationLock.DEFAULT),
	lockPlatform(options) {
		if (!options.screenOrientationArrayIOS) {
			return Promise.reject(new TypeError('iOS requires screenOrientationArrayIOS'))
		}
		const mask = options.screenOrientationArrayIOS.reduce<number>(
			(value, item) => value | bitForOrientation[item],
			0,
		)
		const index = masks.indexOf(mask as (typeof masks)[number])
		return apply(mask, index < 0 ? OrientationLock.OTHER : (index as OrientationLock))
	},
	subscribe(callback) {
		required()
		let bound: NativeWindow | undefined
		const refresh = () => {
			if (currentWindow()?.windowScene) {
				callback()
			}
		}
		const bind = () => {
			bound?.off(NativeWindowEvents.orientationChanged, refresh)
			bound = Application.primaryWindow
			bound?.on(NativeWindowEvents.orientationChanged, refresh)
			refresh()
		}
		changed.add(refresh)
		bind()
		Application.on(WindowEvents.primaryWindowChanged, bind)
		return {
			remove() {
				changed.delete(refresh)
				bound?.off(NativeWindowEvents.orientationChanged, refresh)
				Application.off(WindowEvents.primaryWindowChanged, bind)
			},
		}
	},
	iosSupportedOrientations(value) {
		const window = value as UIWindow | null
		if (window) {
			forwarded.add(window)
		}
		return (window && policies.get(window)?.mask) ?? declaredMask(window) & 26
	},
}
