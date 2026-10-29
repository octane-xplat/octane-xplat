import type { OpenWindowOptions, WindowHandle } from '../../props'

let seq = 0

function featuresFor(options: OpenWindowOptions): string | undefined {
	const features: string[] = []
	if (options.size) {
		features.push(
			`width=${Math.round(options.size.width)}`,
			`height=${Math.round(options.size.height)}`,
		)
	}

	if (options.kind === 'dialog' || options.kind === 'popup') {
		// Browser windows have no real dialog kind — open a detached popup
		// instead of a tab as the closest behavior.
		features.push('popup')
	}

	return features.length ? features.join(',') : undefined
}

/** Wrap a `window.open` result in the shared `WindowHandle`. `win.closed`
 *  is readable cross-origin, so `closed` polls it — a user close of the
 *  browser window settles the handle the same way `close()` does. */
export function openWebWindow(options: OpenWindowOptions): WindowHandle | null {
	const win = window.open(options.url ?? window.location.href, '_blank', featuresFor(options))
	if (!win) {
		return null
	}

	let isClosed = false
	let resolveClosed!: () => void
	const closed = new Promise<void>((resolve) => {
		resolveClosed = resolve
	})

	const timer = setInterval(() => {
		if (win.closed) {
			finish()
		}
	}, 500)

	function finish() {
		if (isClosed) {
			return
		}

		isClosed = true
		clearInterval(timer)
		resolveClosed()
	}

	return {
		id: `w${++seq}`,
		closed,
		get isClosed() {
			return isClosed || win.closed
		},
		close() {
			try {
				win.close()
			} finally {
				finish()
			}
		},
		setTitle(title) {
			// DOM access throws once the window is cross-origin — retitling
			// is only possible while it stays same-origin.
			try {
				win.document.title = title
			} catch {
				// The window is or became cross-origin; titles are its own.
			}
		},
		setSize(size) {
			// resizeTo only applies to script-opened popup windows; browsers
			// may ignore it on tabbed or single-tab windows.
			try {
				win.resizeTo(size.width, size.height)
			} catch {
				// The host declined the resize.
			}
		},
	}
}

/** Open a browser window using the current route unless a URL is supplied.
 *  Returns `null` when the browser refuses the window (popup blocked). */
export function openWindow(options: OpenWindowOptions = {}): WindowHandle | null {
	if (options.data != null) {
		console.warn(
			'[octane-xplat] openWindow: `data` is only delivered by hosts with a window ' +
				'content resolver (native, macOS, Linux); browser windows cannot receive it.',
		)
	}

	return openWebWindow(options)
}
