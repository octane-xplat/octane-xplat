import { Application, Utils } from '@nativescript/core';

// One shared observer tracks the keyboard's current bottom inset — a sheet
// opened while the keyboard is ALREADY up must lift immediately (a
// WillChangeFrame observer only learns about changes after binding), and a
// focused field keeps the inset live across sheet swaps.
const bound = new Set<any>();
let inset = 0;
let wired = false;

const apply = () => {
	bound.forEach((host) => {
		host.translateY = -inset;
	});
};


const wireIos = () => {
	if (wired) { return; }
	wired = true;
	NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
		UIKeyboardWillChangeFrameNotification,
		null,
		NSOperationQueue.mainQueue,
		(note: any) => {
			// UIKeyboardFrameEndUserInfoKey arrives boxed as NSValue whose
			// `CGRectValue` marshals to a plain CGRect object (not a call).
			const raw = note.userInfo.objectForKey(UIKeyboardFrameEndUserInfoKey);
			const boxed = raw?.CGRectValue;
			const frame = typeof boxed === 'function' ? raw.CGRectValue() : (boxed ?? raw);
			inset = Math.max(0, UIScreen.mainScreen.bounds.size.height - (frame?.origin?.y ?? UIScreen.mainScreen.bounds.size.height));
			apply();
		},
	);
};

/** Lift a bottom-anchored overlay host above the software keyboard.
 *  iOS: a shared UIKeyboardWillChangeFrame observer tracks the inset and
 *  translateY shifts the host — reliable on popup views regardless of how
 *  the RootLayout passes margins through. The current inset is applied at
 *  bind time so hosts opened over an already-visible keyboard still lift.
 *  Android: when the window runs `adjustResize` (KeyboardAvoiding sets it)
 *  the RootLayout resizes and the host follows on its own; otherwise the
 *  decor view's IME inset supplies the lift. Returns an unbind that
 *  restores the transform — call it when the host detaches. */
export function bindBottomInsetToKeyboard(host: any): () => void {
	if (Application.ios) {
		wireIos();
		bound.add(host);
		host.translateY = -inset;
		return () => {
			bound.delete(host);
			host.translateY = 0;
		};
	}

	if (Application.android) {
		const nativeWindow = Application.android.foregroundActivity?.window;
		if (!nativeWindow) { return () => {}; }
		const params = (globalThis as any).android?.view?.WindowManager?.LayoutParams;
		if (!params) { return () => {}; }
		// adjustResize resizes the RootLayout for us — an extra offset would
		// double-lift the host.
		if ((nativeWindow.attributes.softInputMode & params.SOFT_INPUT_MASK_ADJUST) === params.SOFT_INPUT_ADJUST_RESIZE) {
			return () => {};
		}

		const ViewCompat = (globalThis as any).androidx?.core?.view?.ViewCompat;
		const WindowInsetsCompat = (globalThis as any).androidx?.core?.view?.WindowInsetsCompat;
		if (!ViewCompat || !WindowInsetsCompat) { return () => {}; }
		const decorView = nativeWindow.decorView;
		const listener = new ViewCompat.OnApplyWindowInsetsListener({
			onApplyWindowInsets: (v: any, insets: any) => {
				const ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
				const nav = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
				// Insets are physical pixels; NativeScript transforms are dips.
				host.translateY = -Utils.layout.toDeviceIndependentPixels(Math.max(0, ime - nav));
				return insets;
			},
		});

		ViewCompat.setOnApplyWindowInsetsListener(decorView, listener);
		return () => {
			host.translateY = 0;
			ViewCompat.setOnApplyWindowInsetsListener(decorView, null);
		};
	}

	return () => {};
}
