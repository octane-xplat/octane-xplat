import { Application, Utils } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import { NSNotificationCenter, NSOperationQueue } from '@octane-xplat/platform/ios'
import {
	keyboardBottomOverlap,
	keyboardBottomDisplacement,
	isKeyboardRect,
} from '@octane-xplat/platform/keyboard-geometry'

import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import { keyboardWindows, unknownKeyboardState } from '@octane-xplat/platform/keyboard-state'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'
import { leaseKeyboardProperty } from '@octane-xplat/platform/keyboard-property'
import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'

const unscopedIosWindow = {}
let iosFrame: any
const iosFrames = new Map<object, any>()
let observer: any = null
const iosReaders = new Set<() => void>()
const refreshFallback = new Map<object, () => void>()

const fromCGRect = (value: any): KeyboardRect | null => {
	const rect = value && {
		x: value.origin?.x,
		y: value.origin?.y,
		width: value.size?.width,
		height: value.size?.height,
	}
	return isKeyboardRect(rect) ? rect : null
}

const readIosState = (window: any): KeyboardWindowState => {
	const windowRect = fromCGRect(window.bounds)
	let targetFrame: KeyboardRect | null = null
	const frame = iosFrames.get(window.screen) ?? iosFrame
	if (frame) {
		const screen = window.screen
		// Since iOS 16.1 the notification identifies its screen. Another display's
		// keyboard must not affect this window.
		targetFrame = fromCGRect(
			screen?.coordinateSpace && window.convertRectFromCoordinateSpace
				? window.convertRectFromCoordinateSpace(frame, screen.coordinateSpace)
				: window.convertRectFromWindow?.(frame, null),
		)
	} else {
		const root = window.rootViewController?.view
		const guide = root?.keyboardLayoutGuide
		const frame = guide?.layoutFrame
		// A hidden keyboard guide includes the bottom safe area. Do not report
		// that strip as an open keyboard, and do not mutate the host's guide.
		if (frame && frame.size.height > (root.safeAreaInsets?.bottom ?? 0) + 1) {
			targetFrame = fromCGRect(root.convertRectToView(frame, window))
		}
	}
	return {
		inset: keyboardBottomOverlap(windowRect, targetFrame),
		windowRect,
		currentFrame: null,
		targetFrame,
		source: targetFrame ? 'destination' : 'unknown',
	}
}

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
			if (note.object?.coordinateSpace) {
				iosFrames.set(note.object, frame)
			} else {
				iosFrame = frame
			}
			const readers = [...iosReaders]
			for (const read of readers) {
				read()
			}
		},
	)
}

const observeIos = (window: object, notify: (value: KeyboardWindowState) => void) => {
	const read = () => notify(readIosState(window))
	iosReaders.add(read)
	refreshFallback.set(window, read)
	const release = () => {
		refreshFallback.delete(window)
		iosReaders.delete(read)
		if (!iosReaders.size && observer) {
			NSNotificationCenter.defaultCenter.removeObserver(observer)
			observer = null
			iosFrame = undefined
			iosFrames.clear()
		}
	}
	try {
		wireIos()
		read()
	} catch (error) {
		release()
		throw error
	}
	return release
}

const nativeLocation = (view: any): { x: number; y: number } | null => {
	if (!view?.getLocationOnScreen || !(Array as any).create) {
		return null
	}
	const xy = (Array as any).create('int', 2)
	view.getLocationOnScreen(xy)
	return { x: xy[0], y: xy[1] }
}

const readAndroidGeometry = (decor: any, ime: number) => {
	const dip = Utils.layout.toDeviceIndependentPixels
	const width = dip(decor.getWidth?.() ?? 0),
		height = dip(decor.getHeight?.() ?? 0)
	const windowRect = width > 0 && height > 0 ? { x: 0, y: 0, width, height } : null
	let targetFrame: KeyboardRect | null = null
	const location = nativeLocation(decor)
	if (windowRect && location && android.graphics?.Rect && decor.getWindowVisibleDisplayFrame) {
		const visible = new android.graphics.Rect()
		decor.getWindowVisibleDisplayFrame(visible)
		// This is the OS-visible viewport, independent of softInputMode. If the
		// host actually resized, its bottom already stops at this edge.
		const top = dip(visible.bottom - location.y)
		if (ime > 0 && top > 0) {
			targetFrame = { x: 0, y: top, width, height: dip(ime) }
		}
	}
	return { windowRect, targetFrame }
}

const observeAndroid = (decor: any, notify: (value: KeyboardWindowState) => void) => {
	const core = (globalThis as any).androidx?.core?.view
	const read = () => {
		const insets = core?.ViewCompat?.getRootWindowInsets(decor)
		const type = core?.WindowInsetsCompat?.Type
		const ime = type ? (insets?.getInsets(type.ime()).bottom ?? 0) : 0
		const nav = type ? (insets?.getInsets(type.systemBars()).bottom ?? 0) : 0
		const geometry = readAndroidGeometry(decor, ime)
		notify({
			inset: Utils.layout.toDeviceIndependentPixels(Math.max(0, ime - nav)),
			...geometry,
			currentFrame: null,
			source: insets ? 'destination' : 'unknown',
		})
	}
	const listener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
		onGlobalLayout: read,
	})
	decor.getViewTreeObserver().addOnGlobalLayoutListener(listener)
	refreshFallback.set(decor, read)
	const release = () => {
		refreshFallback.delete(decor)
		const tree = decor.getViewTreeObserver()
		if (tree.isAlive()) {
			tree.removeOnGlobalLayoutListener(listener)
		}
	}
	try {
		read()
	} catch (error) {
		release()
		throw error
	}
	return release
}

// The fallback is inert until a window has readers. Controller activation can
// replace observation without taking ownership of the readers' resize leases.
export const observeKeyboardDestination: KeyboardWindowSource<KeyboardWindowState> = (
	window,
	publish,
) => {
	if (Application.ios) {
		return observeIos(window, publish)
	}
	if (Application.android) {
		return observeAndroid(window, publish)
	}
	publish(unknownKeyboardState())
	return () => {}
}

keyboardWindows.install(observeKeyboardDestination, 'fallback')

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

const inactiveKeyboardState = unknownKeyboardState()

/** @internal Resolve a supplied host's actual window without observing it. */
export function keyboardWindowForHost(host: any): object | undefined {
	return resolveWindow(host).key
}

/** @internal Read cached state without observing or taking a resize lease. */
export function keyboardSnapshotForHost(host: any): KeyboardWindowState {
	const key = resolveWindow(host).key
	return key ? keyboardWindows.getSnapshot(key) : inactiveKeyboardState
}

/** Internal window-following subscription. Geometry uses the supplied host's
 * actual native window. resize=false is reserved for read-only bindings. */
export function subscribeKeyboardState(
	notify: (state: KeyboardWindowState, windowKey?: object) => void,
	host?: any,
	resize = true,
): () => void {
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
			if (key) {
				refreshFallback.get(key)?.()
				notify(keyboardWindows.getSnapshot(key), key)
			}

			return
		}
		disconnect()
		initialized = true
		key = next.key
		if (!key) {
			notify(unknownKeyboardState())
			return
		}
		releaseLease = resize ? acquireResize(next.resizeWindow) : () => {}
		try {
			const owner = key
			releaseSource = keyboardWindows.subscribe(owner, (state) => notify(state, owner))
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
		notify(unknownKeyboardState())
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
	try {
		rebind()
	} catch (error) {
		active = false
		releaseSession()
		disconnect()
		throw error
	}
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

/** Internal numeric compatibility adapter. Android values retain the raw IME
 * inset minus system bars, including when the host is already resized. */
export function subscribeKeyboardInset(notify: (inset: number) => void, host?: any): () => void {
	return subscribeKeyboardState((state) => notify(state.inset), host)
}

/** Remaining bottom occlusion of this host after physical native resizing.
 * @internal Unknown native geometry is not inferred from a window mode flag. */
const keyboardHostBounds = (host: any, translationY = 0): KeyboardRect | null => {
	const native = host?.nativeViewProtected ?? host?.ios ?? host?.android
	let bounds: KeyboardRect | null = null
	if (Application.ios && native?.window && native.bounds) {
		bounds = fromCGRect(native.convertRectToView(native.bounds, native.window))
	} else if (Application.android && native) {
		const location = nativeLocation(native)
		const origin = nativeLocation(native.getRootView?.())
		if (location && origin) {
			const dip = Utils.layout.toDeviceIndependentPixels
			bounds = {
				x: dip(location.x - origin.x),
				y: dip(location.y - origin.y),
				width: dip(native.getWidth()),
				height: dip(native.getHeight()),
			}
		}
	}
	return bounds ? { ...bounds, y: bounds.y - translationY } : null
}

export function keyboardHostOverlap(
	host: any,
	state: KeyboardWindowState,
	translationY = 0,
): number {
	return keyboardBottomOverlap(
		keyboardHostBounds(host, translationY),
		state.currentFrame ?? state.targetFrame,
	)
}

/** @internal Full lift for a bottom-anchored control, independent of its height. */
export function keyboardHostDisplacement(
	host: any,
	state: KeyboardWindowState,
	translationY = 0,
): number {
	return keyboardBottomDisplacement(
		keyboardHostBounds(host, translationY),
		state.currentFrame ?? state.targetFrame,
	)
}

type BottomBinding = { count: number; release(): void }
const bottomBindings = new WeakMap<object, BottomBinding>()

/** Follow actual host overlap in its own window. Native frames update the
 * property directly; destination-only sources retain discrete compatibility.
 * Observation never replaces a foreign decor inset listener. @internal */
export function bindBottomInsetToKeyboard(host: any): () => void {
	let binding = bottomBindings.get(host)
	if (!binding) {
		const property = leaseKeyboardProperty(
			() => Number(host.translateY) || 0,
			(value) => {
				host.translateY = value
			},
		)

		let off: () => void
		try {
			off = subscribeKeyboardState(
				(state) => {
					const binding = state.bindingFrame
						? { ...state, currentFrame: state.bindingFrame }
						: state
					property.set(-keyboardHostDisplacement(host, binding, property.offset))
				},
				host,
				false,
			)
		} catch (error) {
			property.release()
			throw error
		}

		binding = {
			count: 0,
			release() {
				try {
					off()
				} finally {
					property.release()
				}
			},
		}

		bottomBindings.set(host, binding)
	}
	const owned = binding
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
		bottomBindings.delete(host)
		owned.release()
	}
}
