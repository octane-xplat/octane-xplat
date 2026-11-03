import { Application } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { SplashScreenBackend } from './backend-types'
import type { SplashScreenOptions } from './types'

// UIKit owns the continuation of the app's compiled launch storyboard. The
// first normal app window is the only owner; this is never a re-show API.
// All controller state is process-scoped module state.

// Ambient const enums cannot be read under the repository's module settings:
// NSKeyValueObservingOptions.New and UIViewAutoresizing FlexibleWidth|FlexibleHeight.
const keyValueObservingNew = 1 as NSKeyValueObservingOptions
const flexibleWidthHeight = (2 | 16) as UIViewAutoresizing

interface Scheduled {
	cancelled: boolean
}

let prepared = false
let held = false
let dismissed = false
let hiding = false
let failed = false
let fade = false
let duration = 0.4
let maxHold = 30
// The scene owns the window for the controller's whole lifetime; a strong
// reference here cannot outlive it because dismissal clears both together.
let owner: UIWindow | null = null
let controller: UIViewController | null = null
let visibleObserver: NSObjectProtocol | null = null
let hiddenObserver: NSObjectProtocol | null = null
let rootObserver: NSObject | null = null
let timeout: Scheduled | null = null
let autoHide: Scheduled | null = null

// Only NSObject.extend registers the ObjC subclass — a plain `class extends
// NSObject` never reaches the runtime's class table, so KVO calls would land on
// NSObject's base implementation and never enter JavaScript.
interface RootObserverClass {
	new: () => NSObject
}

/** `extend` is supplied by the runtime bridge, not the declared NSObject type. */
interface NativeExtendable<Class> {
	extend(members: Record<string, unknown>): Class
}

const SplashScreenRootObserver = (
	NSObject as unknown as NativeExtendable<RootObserverClass>
).extend({
	// UIKit removes existing window subviews when NativeScript assigns the
	// scene root. Reattach synchronously after that assignment, before the
	// first frame, and keep the continuation above replacement roots.
	observeValueForKeyPathOfObjectChangeContext(
		_keyPath: string | null,
		object: unknown,
		_change: NSDictionary<string, unknown> | null,
		_context: unknown,
	): void {
		kvoFired += 1
		if (dismissed || hiding) {
			return
		}
		const overlay = controller?.view
		const window = object instanceof UIWindow ? object : owner
		if (!overlay || !window) {
			return
		}
		overlay.frame = window.bounds
		window.addSubview(overlay)
	},
})

// Temporary fixture diagnostics for the migration proof run.
let lastError: string | null = null
let kvoFired = 0

// dispatch_get_main_queue is a C macro outside the runtime metadata; the main
// operation queue's underlying queue is the same main dispatch queue.
const mainQueue = () => NSOperationQueue.mainQueue.underlyingQueue as NSObject & OS_dispatch_queue
function after(seconds: number, run: () => void): Scheduled {
	const work: Scheduled = { cancelled: false }
	dispatch_after(dispatch_time(0, seconds * 1_000_000_000), mainQueue(), () => {
		if (!work.cancelled) {
			run()
		}
	})
	return work
}

function nextTurn(run: () => void): Scheduled {
	const work: Scheduled = { cancelled: false }
	NSOperationQueue.mainQueue.addOperationWithBlock(() => {
		if (!work.cancelled) {
			run()
		}
	})
	return work
}

function storyboardName(): string | null {
	const configured = NSBundle.mainBundle.objectForInfoDictionaryKey('UILaunchStoryboardName')
	if (typeof configured !== 'string' || configured.length === 0) {
		return null
	}
	const name = configured.endsWith('.storyboard') ? configured.slice(0, -11) : configured
	return NSBundle.mainBundle.pathForResourceOfType(name, 'storyboardc') ? name : null
}

function configured(): boolean {
	return storyboardName() !== null
}

function prepare(alreadyStarted: boolean): boolean {
	if (!NSThread.isMainThread) {
		return false
	}
	if (prepared) {
		return !failed
	}
	if (!configured()) {
		return false
	}
	const supplied = NSBundle.mainBundle.objectForInfoDictionaryKey(
		'XplatSplashScreenMaxHoldMilliseconds',
	)
	if (supplied !== undefined && supplied !== null) {
		// Reject non-numeric types (including Booleans), non-integral and
		// out-of-range values exactly like the removed Swift guard.
		const value = supplied instanceof NSNumber ? supplied.doubleValue : supplied
		if (typeof value !== 'number' || !Number.isInteger(value) || value < 100 || value > 120000) {
			return false
		}

		maxHold = value / 1000
	}
	prepared = true
	dismissed = alreadyStarted
	if (alreadyStarted) {
		return true
	}
	// Register during entry-module evaluation, before Application.run() invokes
	// UIApplicationMain; this touches no application or window objects.
	visibleObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
		UIWindowDidBecomeVisibleNotification,
		null,
		null,
		(notification) => {
			const window = notification.object
			// NativeScript's scene delegate makes its primary window visible
			// before assigning the root controller. Attach during that event,
			// before the first scene frame, rather than waiting for a root.
			if (
				!(window instanceof UIWindow) ||
				!NSThread.isMainThread ||
				window.windowLevel !== UIWindowLevelNormal ||
				window.hidden
			) {
				return
			}
			attach(window)
		},
	)
	return true
}

function preventAutoHide(): boolean {
	if (!NSThread.isMainThread || !prepared || dismissed || hiding || failed) {
		return false
	}
	held = true
	if (autoHide) {
		autoHide.cancelled = true
		autoHide = null
	}
	if (timeout === null) {
		timeout = after(maxHold, () => dismiss(false))
	}
	return true
}

function configure(options: SplashScreenOptions): boolean {
	if (!NSThread.isMainThread) {
		return false
	}
	if (options.duration !== undefined) {
		if (
			typeof options.duration !== 'number' ||
			!Number.isFinite(options.duration) ||
			options.duration < 0 ||
			options.duration > 60000
		) {
			return false
		}

		duration = options.duration / 1000
	}
	if (options.fade !== undefined) {
		if (typeof options.fade !== 'boolean') {
			return false
		}

		fade = options.fade
	}
	return true
}

function attach(window: UIWindow): void {
	if (dismissed || hiding || owner !== null) {
		return
	}
	const name = storyboardName()
	let root: UIViewController | null = null
	try {
		root = name
			? UIStoryboard.storyboardWithNameBundle(
					name,
					NSBundle.mainBundle,
				).instantiateInitialViewController()
			: null
	} catch {
		root = null
	}
	const view = root?.view
	if (!root || !view) {
		failed = true
		dismiss(false)
		return
	}
	owner = window
	controller = root
	try {
		view.frame = window.bounds
		view.autoresizingMask = flexibleWidthHeight
		view.accessibilityIdentifier = 'xplat.launch-screen'
		view.accessibilityViewIsModal = true
		// A launch screen blocks input until dismissal without disabling the
		// underlying app window or changing its key-window/interaction state.
		view.userInteractionEnabled = true
		window.addSubview(view)
		const observer = SplashScreenRootObserver.new()
		rootObserver = observer
		window.addObserverForKeyPathOptionsContext(
			observer,
			'rootViewController',
			keyValueObservingNew,
			null,
		)
	} catch (error) {
		lastError = String(error)
		failed = true
		dismiss(false)
		return
	}
	if (visibleObserver) {
		NSNotificationCenter.defaultCenter.removeObserver(visibleObserver)
	}
	visibleObserver = null
	hiddenObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
		UIWindowDidBecomeHiddenNotification,
		window,
		null,
		() => dismiss(false),
	)
	if (!held) {
		autoHide = nextTurn(() => {
			if (!held) {
				dismiss(fade)
			}
		})
	}
}

function dismiss(animated: boolean): void {
	if (!NSThread.isMainThread || dismissed || hiding) {
		return
	}
	held = false
	hiding = true
	if (timeout) {
		timeout.cancelled = true
		timeout = null
	}
	if (autoHide) {
		autoHide.cancelled = true
		autoHide = null
	}
	removeObservers()
	const view = controller?.view
	if (!view || !animated || duration <= 0) {
		finish()
		return
	}
	UIView.animateWithDurationAnimationsCompletion(
		duration,
		() => {
			view.alpha = 0
		},
		() => finish(),
	)
}

function finish(): void {
	controller?.view.removeFromSuperview()
	controller = null
	owner = null
	hiding = false
	dismissed = true
}

function removeObservers(): void {
	if (visibleObserver) {
		NSNotificationCenter.defaultCenter.removeObserver(visibleObserver)
	}
	if (hiddenObserver) {
		NSNotificationCenter.defaultCenter.removeObserver(hiddenObserver)
	}
	visibleObserver = null
	hiddenObserver = null
	if (rootObserver && owner) {
		owner.removeObserverForKeyPath(rootObserver, 'rootViewController')
	}
	rootObserver = null
}

// Native fixture diagnostics; deliberately absent from the JavaScript API.
export function diagnostics(): string {
	const state = failed
		? 'failed'
		: dismissed
			? 'hidden'
			: hiding
				? 'hiding'
				: controller
					? 'visible'
					: prepared
						? 'waiting'
						: 'unprepared'
	return JSON.stringify({
		state,
		held,
		visible: Boolean(controller?.view.superview),
		observers: Boolean(visibleObserver || hiddenObserver || rootObserver),
		timeout: timeout !== null,
		kvo: kvoFired,
		error: lastError,
	})
}

let initDone = false
function ensure(): void {
	if (!configured()) {
		throw new UnavailabilityError('SplashScreen requires a launch storyboard; rebuild the app')
	}
	if (!initDone) {
		if (!prepare(Boolean(Application.started))) {
			throw new Error('Invalid native splash screen configuration')
		}

		initDone = true
	}
}

export const backend: SplashScreenBackend = {
	capabilities: () => {
		const available = configured()
		return { hold: available, fade: available, animationDuration: available }
	},
	preventAutoHide: () => {
		ensure()
		return preventAutoHide()
	},
	hide: () => {
		ensure()
		dismiss(fade)
	},
	configure(options) {
		ensure()
		if (!configure(options)) {
			throw new Error('Invalid native splash screen options')
		}
	},
}
