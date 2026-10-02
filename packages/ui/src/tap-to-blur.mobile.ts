import { Application } from '@nativescript/core'

/** Hide the Android soft keyboard when the user taps the attached view. */
export function attachTapToBlur(view: any): () => void {
	const marker = '__xplatTapToBlur'
	if (!view || view[marker]) {
		return () => {}
	}
	view[marker] = true

	if (!Application.android) {
		return () => {
			view[marker] = false
		}
	}

	const handler = (_args: any) => {
		const activity = Application.android.foregroundActivity
		const focused = activity?.getCurrentFocus()
		if (!focused) {
			return
		}
		const imm = activity.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
		imm?.hideSoftInputFromWindow(focused.getWindowToken(), 0)
	}

	view.on('tap', handler)
	return () => {
		view[marker] = false
		view.off('tap', handler)
	}
}
