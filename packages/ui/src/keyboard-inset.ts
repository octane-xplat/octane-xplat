import { Application, Utils } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import { NSNotificationCenter, NSOperationQueue, UIScreen } from '@octane-xplat/platform/ios'
import { keyboardWindows } from '@octane-xplat/platform/keyboard-state'

const unscopedIosWindow = {}
let inset = 0
let observer: any = null
const iosReaders = new Set<(value: number) => void>()

const wireIos = () => {
	if (observer) {
		return
	}
	observer = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
		UIKeyboardWillChangeFrameNotification,
		null,
		NSOperationQueue.mainQueue,
		(note: any) => {
			const raw = note.userInfo.objectForKey(UIKeyboardFrameEndUserInfoKey)
			const boxed = raw?.CGRectValue
			const frame = typeof boxed === 'function' ? raw.CGRectValue() : (boxed ?? raw)
			inset = Math.max(
				0,
				UIScreen.mainScreen.bounds.size.height -
					(frame?.origin?.y ?? UIScreen.mainScreen.bounds.size.height),
			)
			const readers = [...iosReaders]
			for (const read of readers) {
				read(inset)
			}
		},
	)
}

const observeIos = (notify: (value: number) => void) => {
	iosReaders.add(notify)
	wireIos()
	notify(inset)
	return () => {
		iosReaders.delete(notify)
		if (!iosReaders.size && observer) {
			NSNotificationCenter.defaultCenter.removeObserver(observer)
			observer = null
			inset = 0
		}
	}
}

const observeAndroid = (decor: any, notify: (value: number) => void) => {
	const core = (globalThis as any).androidx?.core?.view
	const read = () => {
		const insets = core?.ViewCompat?.getRootWindowInsets(decor)
		const type = core?.WindowInsetsCompat?.Type
		const ime = type ? (insets?.getInsets(type.ime()).bottom ?? 0) : 0
		const nav = type ? (insets?.getInsets(type.systemBars()).bottom ?? 0) : 0
		notify(Utils.layout.toDeviceIndependentPixels(Math.max(0, ime - nav)))
	}
	const listener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
		onGlobalLayout: read,
	})
	decor.getViewTreeObserver().addOnGlobalLayoutListener(listener)
	read()
	return () => {
		const tree = decor.getViewTreeObserver()
		if (tree.isAlive()) {
			tree.removeOnGlobalLayoutListener(listener)
		}
	}
}

// The fallback is inert until a window has readers. Controller activation can
// replace observation without taking ownership of the readers' resize leases.
keyboardWindows.install((window, publish) => {
	const notify = (value: number) => publish({ inset: value })
	if (Application.ios) {
		return observeIos(notify)
	}
	if (Application.android) {
		return observeAndroid(window, notify)
	}
	notify(0)
	return () => {}
}, 'fallback')

const resizeLeases = new Map<any, { count: number; previous: number; adjusted: number }>()

const acquireResize = (window: any) => {
	const params = (globalThis as any).android?.view?.WindowManager?.LayoutParams
	if (!window || !params) {
		return () => {}
	}
	let lease = resizeLeases.get(window)
	if (!lease) {
		const previous = window.getAttributes().softInputMode
		const adjusted = (previous & ~params.SOFT_INPUT_MASK_ADJUST) | params.SOFT_INPUT_ADJUST_RESIZE
		lease = { count: 0, previous, adjusted }
		resizeLeases.set(window, lease)
		window.setSoftInputMode(adjusted)
	}
	const owned = lease
	owned.count++
	let active = true
	return () => {
		if (!active) {
			return
		}
		active = false
		if (--owned.count) {
			return
		}
		resizeLeases.delete(window)
		if (window.getAttributes().softInputMode === owned.adjusted) {
			window.setSoftInputMode(owned.previous)
		}
	}
}

const resolveWindow = (host?: any): { key?: object; resizeWindow?: any } => {
	const native = host?.nativeViewProtected ?? host?.ios ?? host?.android ?? host
	const session = host?.getNativeWindow?.() ?? (!host ? Application.activeWindow : undefined)
	if (session?.state && session.state !== 'attached') {
		return {}
	}
	if (!host && 'activeWindow' in Application && !session) {
		return {}
	}
	const hostBound =
		host && ('nativeViewProtected' in host || 'window' in host || typeof host.on === 'function')
	if (host?.isLoaded === false) {
		return {}
	}
	if (Application.ios) {
		const key =
			native?.window ??
			(hostBound
				? undefined
				: (session?.ios?.uiWindow ??
					Application.ios.nativeApp?.keyWindow ??
					Application.ios.window ??
					unscopedIosWindow))

		return { key }
	}
	if (Application.android) {
		if (!(globalThis as any).android?.view?.WindowManager?.LayoutParams) {
			return {}
		}

		const window =
			session?.android?.activity?.getWindow() ?? Application.android.foregroundActivity?.getWindow()

		const decor = window?.getDecorView()
		const key = native?.getRootView?.() ?? (hostBound ? undefined : decor)
		return { key, resizeWindow: key === decor ? window : undefined }
	}
	return {}
}

/** Internal window-following subscription shared by hooks and host bindings. */
export function subscribeKeyboardInset(notify: (inset: number) => void, host?: any): () => void {
	let key: object | undefined
	let initialized = false
	let active = true
	let releaseSource = () => {}
	let releaseLease = () => {}
	let session: any
	const releaseSession = () => {
		session?.off?.('attached', rebind)
		session?.off?.('activate', rebind)
		session?.off?.('detached', sessionDetached)
		session?.off?.('close', closed)
		session = undefined
	}
	const disconnect = () => {
		const source = releaseSource,
			lease = releaseLease
		releaseSource = () => {}
		releaseLease = () => {}
		try {
			source()
		} finally {
			lease()
		}
	}
	const rebind = () => {
		if (!active) {
			return
		}
		const candidate = host?.getNativeWindow?.() ?? (!host ? Application.activeWindow : undefined)
		const nextSession = candidate?.state === 'closed' ? undefined : candidate
		if (session !== nextSession) {
			releaseSession()
			session = nextSession
			session?.on?.('attached', rebind)
			session?.on?.('activate', rebind)
			session?.on?.('detached', sessionDetached)
			session?.on?.('close', closed)
		}
		const next = resolveWindow(host)
		if (initialized && next.key === key) {
			return
		}
		disconnect()
		initialized = true
		key = next.key
		if (!key) {
			notify(0)
			return
		}
		releaseLease = acquireResize(next.resizeWindow)
		try {
			releaseSource = keyboardWindows.subscribe(key, (state) => notify(state.inset))
		} catch (error) {
			disconnect()
			throw error
		}
	}
	const unloaded = () => {
		if (!active) {
			return
		}
		disconnect()
		key = undefined
		initialized = false
		notify(0)
	}
	const sessionDetached = (event: any) => {
		const owner = event?.window ?? event?.object
		if (owner && owner !== session) {
			return
		}
		unloaded()
	}
	const closed = (event: any) => {
		const owner = event?.window ?? event?.object
		if (owner && owner !== session) {
			return
		}
		releaseSession()
		unloaded()
	}
	rebind()
	Application.on?.(Application.resumeEvent, rebind)
	Application.on?.('primaryWindowChanged', rebind)
	Application.on?.('windowOpen', rebind)
	Application.on?.('windowClose', rebind)
	Application.android?.on?.('activityResumed', rebind)
	host?.on?.('loaded', rebind)
	host?.on?.('layoutChanged', rebind)
	host?.on?.('unloaded', unloaded)
	let keyObserver: any
	if (!host && Application.ios && typeof UIWindowDidBecomeKeyNotification !== 'undefined') {
		keyObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			UIWindowDidBecomeKeyNotification,
			null,
			NSOperationQueue.mainQueue,
			rebind,
		)
	}
	return () => {
		if (!active) {
			return
		}
		active = false
		Application.off?.(Application.resumeEvent, rebind)
		Application.off?.('primaryWindowChanged', rebind)
		Application.off?.('windowOpen', rebind)
		Application.off?.('windowClose', rebind)
		Application.android?.off?.('activityResumed', rebind)
		host?.off?.('loaded', rebind)
		host?.off?.('layoutChanged', rebind)
		host?.off?.('unloaded', unloaded)
		if (keyObserver) {
			NSNotificationCenter.defaultCenter.removeObserver(keyObserver)
		}
		releaseSession()
		disconnect()
	}
}

const androidBindings = new WeakMap<object, { hosts: Map<any, number>; offset: number }>()

/** Lift a bottom-anchored overlay host above the software keyboard.
 *  iOS: a shared UIKeyboardWillChangeFrame observer tracks the inset and
 *  translateY shifts the host — reliable on popup views regardless of how
 *  the RootLayout passes margins through. The current inset is applied at
 *  attachment time so hosts opened over an already-visible keyboard still lift.
 *  Android: when the window runs `adjustResize` (KeyboardAvoiding sets it)
 *  the RootLayout resizes and the host follows on its own; otherwise the
 *  decor view's IME inset supplies the lift. Returns an unbind that
 *  restores the transform — call it when the host detaches. */
export function bindBottomInsetToKeyboard(host: any): () => void {
	if (Application.ios) {
		const off = subscribeKeyboardInset((value) => {
			host.translateY = -value
		}, host)

		let active = true
		return () => {
			if (!active) {
				return
			}
			active = false
			off()
			host.translateY = 0
		}
	}

	if (Application.android) {
		const nativeWindow = Application.android.foregroundActivity?.getWindow()
		if (!nativeWindow) {
			return () => {}
		}

		const params = (globalThis as any).android?.view?.WindowManager?.LayoutParams
		if (!params) {
			return () => {}
		}

		// adjustResize resizes the RootLayout for us — an extra offset would
		// double-lift the host.
		if (
			(nativeWindow.getAttributes().softInputMode & params.SOFT_INPUT_MASK_ADJUST) ===
			params.SOFT_INPUT_ADJUST_RESIZE
		) {
			return () => {}
		}

		const coreView = (globalThis as any).androidx?.core?.view
		const ViewCompat = coreView?.ViewCompat
		const WindowInsetsCompat = coreView?.WindowInsetsCompat
		const OnApplyWindowInsetsListener = coreView?.OnApplyWindowInsetsListener
		if (!ViewCompat || !WindowInsetsCompat || !OnApplyWindowInsetsListener) {
			return () => {}
		}

		const decorView = nativeWindow.getDecorView()
		let entry = androidBindings.get(decorView)
		if (!entry) {
			const created = { hosts: new Map<any, number>(), offset: 0 }
			const listener = new OnApplyWindowInsetsListener({
				onApplyWindowInsets: (_view: any, insets: any) => {
					const ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
					const nav = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
					created.offset = -Utils.layout.toDeviceIndependentPixels(Math.max(0, ime - nav))
					for (const boundHost of created.hosts.keys()) {
						boundHost.translateY = created.offset
					}

					return insets
				},
			})

			entry = created
			androidBindings.set(decorView, entry)
			ViewCompat.setOnApplyWindowInsetsListener(decorView, listener)
			ViewCompat.requestApplyInsets?.(decorView)
		}

		const binding = entry
		binding.hosts.set(host, (binding.hosts.get(host) ?? 0) + 1)
		host.translateY = binding.offset
		let released = false
		return () => {
			if (released) {
				return
			}

			released = true
			const count = binding.hosts.get(host) ?? 0
			if (count > 1) {
				binding.hosts.set(host, count - 1)
			} else {
				binding.hosts.delete(host)
				host.translateY = 0
			}

			if (!binding.hosts.size) {
				androidBindings.delete(decorView)
				ViewCompat.setOnApplyWindowInsetsListener(decorView, null)
			}
		}
	}

	return () => {}
}
