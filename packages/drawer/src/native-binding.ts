import type { DrawerProps } from './props'

export interface DrawerHost {
	isOpened(side: 'left'): boolean
	open(side: 'left', duration?: number): Promise<void>
	close(side: 'left', duration?: number): Promise<void>
}

/** Serializes prop changes behind completion events. ui-drawer's open()
 * promise resolves before its animation, so events are the completion boundary. */
export function bindDrawer(
	host: DrawerHost,
	read: () => DrawerProps,
): {
	sync: () => void
	reportError: (error: unknown) => void
	ready(): void
	settled(open: boolean): void
	dismiss(): void
	dispose(): void
} {
	let internal = read().defaultOpen ?? false
	let pending: boolean | null = null
	let ready = false
	let disposed = false
	const desired = () => read().open ?? internal
	const reportError = (error: unknown): void => {
		if (disposed) {
			return
		}
		pending = null
		if (read().onError) {
			read().onError!(error)
		} else {
			console.error('[octane-xplat/drawer] animation failed', error)
		}
	}
	const sync = (): void => {
		if (disposed || !ready || pending !== null) {
			return
		}
		const next = desired()
		if (host.isOpened('left') === next) {
			return
		}
		pending = next
		try {
			const duration = read().reducedMotion ? 0 : undefined
			const operation = next ? host.open('left', duration) : host.close('left', duration)
			operation.catch(reportError)
		} catch (error) {
			reportError(error)
		}
	}
	return {
		sync,
		reportError,
		ready(): void {
			ready = true
			sync()
		},
		settled(open: boolean): void {
			if (disposed) {
				return
			}
			if (pending !== null) {
				pending = null
				sync()
				return
			}
			if (open !== desired()) {
				if (read().open === undefined) {
					internal = open
				}

				read().onOpenChange?.(open)
				if (!open) {
					read().onDismiss?.()
				}
			}
			// Give a controlled owner time to render the requested state before
			// restoring a rejected gesture.
			queueMicrotask(sync)
		},
		dismiss(): void {
			if (disposed || !desired()) {
				return
			}
			if (read().open === undefined) {
				internal = false
			}
			read().onOpenChange?.(false)
			read().onDismiss?.()
			queueMicrotask(sync)
		},
		dispose(): void {
			disposed = true
		},
	}
}
