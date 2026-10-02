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
 *  `cancelsTouchesInView` stays false so taps still reach buttons. */
export function attachTapToBlur(view: any): () => void {
	const marker = '__xplatTapToBlur'
	if (!view || view[marker]) {
		return () => {}
	}

	view[marker] = true

	iosAttach()
	return () => {
		view[marker] = false
		iosDetach()
	}
}

let iosCount = 0
let iosTarget: any = null
let iosRecognizer: any = null
let iosWindow: any = null

function iosAttach() {
	iosCount++
	if (iosRecognizer) {
		return
	}

	const appWin = appWindow()
	if (!appWin) {
		return
	}

	iosWindow = appWin
	// Resolve Objective-C bridge globals only when the iOS view is attached.
	@NativeClass
	class TapToBlurRecognizerTarget extends NSObject implements UIGestureRecognizerDelegate {
		static ObjCProtocols = [UIGestureRecognizerDelegate]
		static ObjCExposedMethods = {
			tap: { returns: interop.types.void, params: [UITapGestureRecognizer] },
		}

		gestureRecognizerShouldReceiveTouch(_recognizer: any, touch: any) {
			let hit = touch.view
			while (hit) {
				const textField = hit.isKindOfClass(UITextField.class())
				const textView = hit.isKindOfClass(UITextView.class())
				if (textField || textView) {
					return false
				}

				hit = hit.superview
			}

			return true
		}

		tap(_recognizer: any) {
			iosWindow.endEditing(true)
		}
	}

	iosTarget = TapToBlurRecognizerTarget.new()
	iosRecognizer = UITapGestureRecognizer.alloc().initWithTargetAction(iosTarget, 'tap')
	iosRecognizer.delegate = iosTarget
	iosRecognizer.cancelsTouchesInView = false
	appWin.addGestureRecognizer(iosRecognizer)
}

function iosDetach() {
	iosCount--
	if (iosCount > 0 || !iosRecognizer) {
		return
	}

	iosWindow?.removeGestureRecognizer(iosRecognizer)
	iosRecognizer = null
	iosTarget = null
	iosWindow = null
}

function appWindow() {
	const scenes = UIApplication.sharedApplication.connectedScenes
	// connectedScenes is an NSSet — `allObjects` marshals to a JS array.
	for (const scene of (scenes as any).allObjects ?? []) {
		if (scene instanceof UIWindowScene) {
			for (const w of (scene.windows as any)?.allObjects ?? scene.windows ?? []) {
				if (w.isKeyWindow) {
					return w
				}
			}
		}
	}

	return UIApplication.sharedApplication.keyWindow
}
