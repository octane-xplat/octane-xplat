const writing = new WeakSet<object>()

/** Whether a textChange is the synchronous echo of our controlled write. */
export function isWritingText(view: object): boolean {
	return writing.has(view)
}

function selection(view: any): { native: any; start: number; length: number } | null {
	try {
		const native = view.nativeViewProtected
		const start = native?.SelectionStart
		const length = native?.SelectionLength
		if (
			typeof native?.Select === 'function' &&
			Number.isSafeInteger(start) &&
			start >= 0 &&
			Number.isSafeInteger(length) &&
			length >= 0
		) {
			return { native, start, length }
		}
	} catch {
		// PasswordBox and detached controls need only the guarded text write.
	}
	return null
}

/** Keep a WinUI TextBox selection around controlled writes, clamped after shrink. */
export function writeText(view: any, value: string | undefined | null): void {
	const next = value ?? ''
	if (!view || view.text === next) {
		return
	}

	const previous = selection(view)
	const nested = writing.has(view)
	writing.add(view)
	try {
		view.text = next
		// A synchronous callback can replace the native view or write a newer value.
		if (previous && view.nativeViewProtected === previous.native && view.text === next) {
			const start = Math.min(previous.start, next.length)
			try {
				previous.native.Select(start, Math.min(previous.length, next.length - start))
			} catch {
				// Selection restoration must not discard an accepted text update.
			}
		}
	} finally {
		if (!nested) {
			writing.delete(view)
		}
	}
}
