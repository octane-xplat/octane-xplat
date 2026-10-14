import { Application } from '@nativescript/core'
import type { OpenWindowOptions, WindowHandle } from './props'

let seq = 0

// `Application.openWindow` returns void — the request's window arrives
// later as an Application 'windowOpen' registration. Bindings queue FIFO so
// each call claims the next registered window in call order. The host
// reports no per-request outcome: a request the platform drops (a
// single-scene iPhone, an unsupported target) leaves its binding queued and
// the handle's `closed` unsettled — WindowHandle's docs carry that limit.
const pending: Array<(win: any) => void> = []
let listening = false

function ensureWindowListener(): void {
	if (listening) {
		return
	}

	listening = true
	Application.on('windowOpen', (args) => {
		pending.shift()?.(args.window)
	})
}

/** Open another NativeScript window and pass app-owned data to its
 *  resolver. Returns `null` when the host reports synchronously that it
 *  cannot open a window. */
export function openWindow(options: OpenWindowOptions = {}): WindowHandle | null {
	ensureWindowListener()

	let native: any = null
	let closeRequested = false
	let isClosed = false
	let resolveClosed!: () => void
	const closed = new Promise<void>((resolve) => {
		resolveClosed = resolve
	})

	const finish = () => {
		if (isClosed) {
			return
		}

		isClosed = true
		resolveClosed()
	}

	const bind = (win: any) => {
		native = win
		win?.on?.('close', finish)
		if (closeRequested) {
			try {
				win?.close?.()
			} catch {
				// The surface is gone by definition if close() throws.
			}
		}
	}

	pending.push(bind)

	try {
		Application.openWindow({ data: options.data as Record<string, any> })
	} catch (error) {
		pending.splice(pending.indexOf(bind), 1)
		finish()
		console.warn(
			`[octane-xplat] openWindow failed: ${(error as Error)?.message ?? String(error)}`,
		)

		return null
	}

	return {
		id: `w${++seq}`,
		closed,
		get isClosed() {
			return isClosed || native?.state === 'closed'
		},
		close() {
			if (isClosed) {
				return
			}

			if (native) {
				try {
					native.close()
				} catch {
					finish()
				}
			} else {
				// Not yet bound — close on bind if the window still opens, and
				// settle the handle now so `closed` awaiters don't hang.
				closeRequested = true
				finish()
			}
		},
	}
}
