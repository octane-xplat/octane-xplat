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
export declare function attachTapToBlur(view: any): () => void;
