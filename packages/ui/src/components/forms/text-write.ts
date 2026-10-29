const writing = new WeakSet<object>()

/** Whether a textChange is the synchronous echo of our controlled write. */
export function isWritingText(view: object): boolean {
	return writing.has(view)
}

/** Controlled `text` write for TextInput/TextArea/SearchInput leaves. The driver's
 *  generic prop path writes view.text verbatim; on Android the EditText
 *  setText resets the cursor to 0 on every controlled write. Park and
 *  restore the selection around the write (clamped to the new length so an
 *  append-shrink can't throw). iOS keeps the plain write — UITextField's
 *  text setter preserves the selected text range already.
 *  Returns without writing when the value already matches — the textChange
 *  echo of the user's own typing must not bounce back through setText. */
export function writeText(view: any, value: string | undefined | null): void {
	const next = value ?? ''
	if (!view || view.text === next) {
		return
	}

	const et = view.android
	const start = et?.getSelectionStart?.() ?? -1
	const end = et?.getSelectionEnd?.() ?? -1
	const nested = writing.has(view)
	writing.add(view)
	try {
		view.text = next
		if (start >= 0) {
			const len = next.length
			et.setSelection(Math.min(start, len), Math.min(end >= 0 ? end : start, len))
		}
	} finally {
		if (!nested) {
			writing.delete(view)
		}
	}
}
