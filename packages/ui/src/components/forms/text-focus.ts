/** Dismiss the keyboard and release native editing focus. NativeScript's
 * dismissSoftInput returns void; its return value is not a fallback signal. */
export function blurText(view: any): void {
	if (typeof view.dismissSoftInput === 'function') {
		view.dismissSoftInput()
	} else {
		view.blur?.()
	}

	// Android dismissSoftInput hides the IME but retains EditText focus.
	view.android?.clearFocus?.()
}
