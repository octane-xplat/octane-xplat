import { Application, Utils } from '@nativescript/core'

// One shared observer tracks the keyboard's current bottom inset — a sheet
// opened while another reader or overlay tracks the keyboard can lift
// immediately. Mount a reader before focus to retain frames across sheet swaps.
const bound = new Set<any>()
let inset = 0
let observer: any = null
const subscribers = new Set<(inset: number) => void>()

const apply = () => {
	subscribers.forEach((notify) => notify(inset))
	bound.forEach((host) => {
		host.translateY = -inset
	})
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
			// UIKeyboardFrameEndUserInfoKey arrives boxed as NSValue whose
			// `CGRectValue` marshals to a plain CGRect object (not a call).
			const raw = note.userInfo.objectForKey(UIKeyboardFrameEndUserInfoKey)
			const boxed = raw?.CGRectValue
			const frame = typeof boxed === 'function' ? raw.CGRectValue() : (boxed ?? raw)
			inset = Math.max(
				0,
				UIScreen.mainScreen.bounds.size.height -
					(frame?.origin?.y ?? UIScreen.mainScreen.bounds.size.height),
			)

			apply()
		},
	)
}

const unwireIos = () => {
	if (bound.size || subscribers.size || !observer) {
		return
	}

	NSNotificationCenter.defaultCenter.removeObserver(observer)
	observer = null
	inset = 0
}

// One resize lease and layout observer per Activity window, across all hook readers.
const androidWindows = new Map<
	any,
	{
		listeners: Set<(inset: number) => void>
		read: () => void
		observer: any
		decor: any
		previous: number
		adjusted: number
	}
>()

/** Internal subscription shared by the public hook and keyboard-avoiding wrapper. */
export function subscribeKeyboardInset(notify: (inset: number) => void): () => void {
	if (Application.ios) {
		subscribers.add(notify)
		wireIos()
		notify(inset)
		return () => {
			subscribers.delete(notify)
			unwireIos()
		}
	}

	const nativeWindow = Application.android?.foregroundActivity?.getWindow()
	const params = (globalThis as any).android?.view?.WindowManager?.LayoutParams
	const ViewCompat = (globalThis as any).androidx?.core?.view?.ViewCompat
	const WindowInsetsCompat = (globalThis as any).androidx?.core?.view?.WindowInsetsCompat
	if (!nativeWindow || !params) {
		notify(0)
		return () => {}
	}

	let state = androidWindows.get(nativeWindow)
	if (!state) {
		const decor = nativeWindow.getDecorView()
		const previous = nativeWindow.getAttributes().softInputMode
		const adjusted = (previous & ~params.SOFT_INPUT_MASK_ADJUST) | params.SOFT_INPUT_ADJUST_RESIZE
		const listeners = new Set<(inset: number) => void>()
		const read = () => {
			const insets = WindowInsetsCompat ? ViewCompat?.getRootWindowInsets(decor) : null
			const ime = insets?.getInsets(WindowInsetsCompat.Type.ime()).bottom ?? 0
			const nav = insets?.getInsets(WindowInsetsCompat.Type.systemBars()).bottom ?? 0
			const value = Utils.layout.toDeviceIndependentPixels(Math.max(0, ime - nav))
			listeners.forEach((listener) => listener(value))
		}

		const observer = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
			onGlobalLayout: read,
		})

		state = { listeners, read, observer, decor, previous, adjusted }
		androidWindows.set(nativeWindow, state)
		decor.getViewTreeObserver().addOnGlobalLayoutListener(observer)
		nativeWindow.setSoftInputMode(adjusted)
	}

	const owned = state
	owned.listeners.add(notify)
	owned.read()
	let active = true
	return () => {
		if (!active) {
			return
		}

		active = false
		owned.listeners.delete(notify)
		if (owned.listeners.size) {
			return
		}

		const tree = owned.decor.getViewTreeObserver()
		if (tree.isAlive()) {
			tree.removeOnGlobalLayoutListener(owned.observer)
		}

		// Preserve changes made by another owner while this lease was active.
		if (nativeWindow.getAttributes().softInputMode === owned.adjusted) {
			nativeWindow.setSoftInputMode(owned.previous)
		}

		androidWindows.delete(nativeWindow)
	}
}

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
		wireIos()
		bound.add(host)
		host.translateY = -inset
		return () => {
			bound.delete(host)
			unwireIos()
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

		const ViewCompat = (globalThis as any).androidx?.core?.view?.ViewCompat
		const WindowInsetsCompat = (globalThis as any).androidx?.core?.view?.WindowInsetsCompat
		if (!ViewCompat || !WindowInsetsCompat) {
			return () => {}
		}

		const decorView = nativeWindow.getDecorView()
		const listener = new ViewCompat.OnApplyWindowInsetsListener({
			onApplyWindowInsets: (v: any, insets: any) => {
				const ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
				const nav = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
				// Insets are physical pixels; NativeScript transforms are dips.
				host.translateY = -Utils.layout.toDeviceIndependentPixels(Math.max(0, ime - nav))
				return insets
			},
		})

		ViewCompat.setOnApplyWindowInsetsListener(decorView, listener)
		return () => {
			host.translateY = 0
			ViewCompat.setOnApplyWindowInsetsListener(decorView, null)
		}
	}

	return () => {}
}
