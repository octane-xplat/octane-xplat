import { Application } from '@nativescript/core';

/** Tap-outside-to-blur: iOS keeps a focused UITextField/UITextView as first
 *  responder until something else takes it, so a tap on blank chrome never
 *  dismisses the keyboard on its own.
 *
 *  iOS: a single window-level UITapGestureRecognizer (ref-counted across
 *  attach calls) sees every touch in the app window — popups/sheets included —
 *  where a recognizer on an intermediate container proved unreliable. On each
 *  tap we hit-test and resign first responder unless the hit view is an
 *  editable text view (otherwise the field would focus-then-blur in the same
 *  tap — recognizers fire on touch-up, after the field's touch-down focus).
 *  Keyboard taps live in a separate UIWindow, so they never reach it.
 *  `cancelsTouchesInView` stays false so taps still reach buttons.
 *
 *  Android: hides the soft keyboard from the currently focused view when a
 *  tap lands on the attached container. */
export function attachTapToBlur(view: any): () => void {
	const marker = '__xplatTapToBlur';
	if (!view || view[marker]) {return () => {};}
	view[marker] = true;

	if (Application.ios) {
		iosAttach();
		return () => {
			view[marker] = false;
			iosDetach();
		};
	}

	if (Application.android) {
		const handler = (_args: any) => {
			const activity = Application.android.foregroundActivity;
			const focused = activity?.currentFocus;
			if (!focused) {return;}
			const imm = activity.getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
			imm?.hideSoftInputFromWindow(focused.getWindowToken(), 0);
		};

		view.on('tap', handler);
		return () => {
			view[marker] = false;
			view.off('tap', handler);
		};
	}

	return () => {
		view[marker] = false;
	};
}

let iosCount = 0;
let iosTarget: any = null;
let iosRecognizer: any = null;
let iosWindow: any = null;

function iosAttach() {
	iosCount++;
	if (iosRecognizer) {return;}
	const appWin = appWindow();
	if (!appWin) {return;}
	iosWindow = appWin;

	const Owner = class extends NSObject {
		static ObjCExposedMethods = {
			tap: { returns: interop.types.void, params: [UITapGestureRecognizer] },
		};
		tap(recognizer: any) {
			const point = recognizer.locationInView(iosWindow);
			// hitTest can land on a text field's internal subview — walk up.
			let hit = iosWindow.hitTest(point, null);
			while (hit) {
				if (hit instanceof UITextField || hit instanceof UITextView) {return;}
				hit = hit.superview;
			}

			iosWindow.endEditing(true);
		}
	};

	iosTarget = Owner.new();
	iosRecognizer = UITapGestureRecognizer.alloc().initWithTargetAction(iosTarget, 'tap');
	iosRecognizer.cancelsTouchesInView = false;
	appWin.addGestureRecognizer(iosRecognizer);
}

function iosDetach() {
	iosCount--;
	if (iosCount > 0 || !iosRecognizer) {return;}
	iosWindow?.removeGestureRecognizer(iosRecognizer);
	iosRecognizer = null;
	iosTarget = null;
	iosWindow = null;
}

function appWindow() {
	const scenes = UIApplication.sharedApplication.connectedScenes;
	// connectedScenes is an NSSet — `allObjects` marshals to a JS array.
	for (const scene of (scenes as any).allObjects ?? []) {
		if (scene instanceof UIWindowScene) {
			for (const w of (scene.windows as any)?.allObjects ?? scene.windows ?? []) {
				if (w.isKeyWindow) {return w;}
			}
		}
	}

	return UIApplication.sharedApplication.keyWindow;
}
