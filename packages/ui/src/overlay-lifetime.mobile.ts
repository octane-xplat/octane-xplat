import type { GridLayout, RootLayout, RootLayoutOptions } from '@nativescript/core'

/** Own the resources of one independently mounted overlay. RootLayout emits
 * closed before removing the host, so that notification must never reenter close. */
export function createOverlayLifetime(
	owner: RootLayout,
	host: GridLayout,
	root: { unmount(): void },
	label: string,
	onFinish: (dismissed: boolean) => void,
) {
	let released = false
	let closing = false
	const cleanups = new Set<() => void>()
	const report = (action: string, error: unknown) =>
		console.error(`[${label}] ${action} failed`, error)
	const release = (dismissed: boolean) => {
		if (released) return
		released = true
		host.off('closed', onClosed)
		for (const cleanup of cleanups) cleanup()
		cleanups.clear()
		root.unmount()
		onFinish(dismissed)
	}
	const onClosed = () => {
		closing = true
		release(true)
	}
	const detach = () => {
		if (closing || !owner.hasChild(host)) return
		// A shade tap or another caller may already be animating the close.
		if (owner.getPopupIndex(host) === -1) return
		closing = true
		const failed = (error: unknown) => {
			report('close', error)
			if (owner.hasChild(host)) owner.removeChild(host)
		}
		try {
			void owner.close(host).catch(failed)
		} catch (error) {
			failed(error)
		}
	}

	host.on('closed', onClosed)
	return {
		own(cleanup: () => void) {
			if (released) cleanup()
			else cleanups.add(cleanup)
		},
		close() {
			release(false)
			detach()
		},
		open(options?: RootLayoutOptions, afterOpen?: () => void | Promise<void>) {
			const failed = (error: unknown) => {
				report('open', error)
				release(false)
				detach()
			}
			try {
				void owner
					.open(host, options)
					.then(() => {
						if (released) detach()
						else return afterOpen?.()
					})
					.catch(failed)
			} catch (error) {
				failed(error)
			}
		},
	}
}
