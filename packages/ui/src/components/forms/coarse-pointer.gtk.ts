import Gdk from 'gi://Gdk?version=4.0'

/** True when any seat exposes a touch device — the GTK 'adaptive' coarse-
 *  pointer signal (desktop X11/Wayland sessions report pointer/tablet
 *  only, so 'adaptive' resolves to the anchored popover there). */
export function hasCoarsePointer(): boolean {
	try {
		const display = Gdk.Display.get_default?.()
		const seats = display?.list_seats?.() ?? []
		for (const seat of seats) {
			const capabilities = seat.get_capabilities?.() ?? 0
			// eslint-disable-next-line no-bitwise
			if ((capabilities & Gdk.SeatCapability.TOUCH) !== 0) {
				return true
			}
		}
	} catch { }
	return false
}
