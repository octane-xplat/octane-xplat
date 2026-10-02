/** Own the resources of one independently mounted overlay. RootLayout emits
 * closed before removing the host, so that notification must never reenter close. */
type OverlayHost = {
	on(eventName: string, listener: (...args: any[]) => void): void
	off(eventName: string, listener: (...args: any[]) => void): void
}

type OverlayOwner = {
	close(host: any): Promise<unknown>
	open(host: any, options?: any): Promise<unknown>
	removeChild(host: any): void
}

export function createOverlayLifetime(
	owner: OverlayOwner,
	host: OverlayHost,
	root: { unmount(): void },
	label: string,
	onFinish: (dismissed: boolean) => void,
) {
	// RootLayout removes closing hosts from its private popup registry before
	// their exit animation finishes. Inspect that runtime seam to avoid reentry.
	const registry = owner as unknown as {
		hasChild(view: any): boolean
		getPopupIndex(view: any): number
	}

	let released = false
	let closing = false
	const cleanups = new Set<() => void>()
	const report = (action: string, error: unknown) =>
		console.error(`[${label}] ${action} failed`, error)

	const release = (dismissed: boolean) => {
		if (released) {
			return
		}

		released = true
		host.off('closed', onClosed)
		for (const cleanup of cleanups) {
			cleanup()
		}

		cleanups.clear()
		root.unmount()
		onFinish(dismissed)
	}

	const onClosed = () => {
		closing = true
		release(true)
	}

	const detach = () => {
		if (closing || !registry.hasChild(host)) {
			return
		}

		// A shade tap or another caller may already be animating the close.
		if (registry.getPopupIndex(host) === -1) {
			return
		}

		closing = true
		const failed = (error: unknown) => {
			report('close', error)
			if (registry.hasChild(host)) {
				owner.removeChild(host)
			}
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
			if (released) {
				cleanup()
			} else {
				cleanups.add(cleanup)
			}
		},
		close() {
			release(false)
			detach()
		},
		open(options?: any, afterOpen?: () => void | Promise<void>) {
			const failed = (error: unknown) => {
				report('open', error)
				release(false)
				detach()
			}

			try {
				void owner
					.open(host, options)
					.then(() => {
						if (released) {
							detach()
						} else {
							return afterOpen?.()
						}
					})
					.catch(failed)
			} catch (error) {
				failed(error)
			}
		},
	}
}
