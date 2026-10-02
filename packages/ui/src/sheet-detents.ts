import { FlexboxLayout, Screen, type View } from '@nativescript/core'
import { detentOffset, normalizeDetents, snapDetentIndex } from './sheet-snap'

const SNAP_MS = 200

export interface SheetDetentsController {
	/** Slide the panel in from below the screen edge — call once the host
	 *  is inside the RootLayout (the RootLayout open call replaces the
	 *  built-in enter/exit animation, which would fight detent offsets:
	 *  it always animates translateY to 0). */
	enter: () => void
	detach: () => void
}

/** Drag-to-snap detents on a RootLayout sheet host: a self-drawn grabber
 *  strip (top-aligned grid child — the only drag target, so it never
 *  fights inner scrolling) drives the host's translateY; the host is
 *  sized to the largest detent and parked at the offset for the current
 *  one. `closeNow` fires after the dismiss slide-out — the caller decides
 *  what closing means (declarative `onDismiss` via RootLayout 'closed',
 *  or the `openSheet` resolution).
 *
 *  In-window on native: the OS detent presentations
 *  (UISheetPresentationController / BottomSheetBehavior via
 *  BottomSheetDialogFragment) host a modal VC or a separate dialog
 *  window — a different surface contract than the RootLayout child this
 *  sheet is (UIModal/MaterialDialog own the modal path), so the snap
 *  mechanics are self-drawn and identical to the web leaf. */
export function attachSheetDetents(
	host: any,
	detents: readonly number[],
	closeNow: () => void,
): SheetDetentsController {
	const sorted = normalizeDetents(detents)
	if (!sorted.length) {
		return { detach: () => {}, enter: () => {} }
	}

	// Parentless at attach (before RootLayout.open) — fall back to screen
	// dips; every gesture-time read uses the real parent height.
	const vh = () => host.parent?.getActualSize?.().height || Screen.mainScreen.heightDIPs
	const max = sorted[sorted.length - 1]
	let cur = 0

	host.verticalAlignment = 'bottom'
	host.translateY = vh() // fully below the screen until enter()

	const grabber = new FlexboxLayout()
	grabber.className = 'vx-sheet-grabber'
	grabber.verticalAlignment = 'top'
	const grip = new FlexboxLayout()
	grip.className = 'vx-sheet-grip'
	// FlexboxLayout is a View at runtime; NativeScript's generated symbol
	// setter index signatures make its Android declaration incompatible.
	grabber.addChild(grip as unknown as View)
	host.addChild(grabber)

	let dragging = false
	let dy0 = 0 // pan deltaY baseline — the gesture reports cumulative deltas
	let ty0 = 0
	let vy = 0
	let lastDy = 0
	let lastT = 0

	const animateTo = (value: number, then?: () => void) => {
		const done = host.animate?.({ translate: { x: 0, y: value }, duration: SNAP_MS })
		if (!then) {
			return
		}

		if (done?.then) {
			done.then(() => then())
		} else {
			setTimeout(then, SNAP_MS)
		}
	}

	const end = () => {
		if (!dragging) {
			return
		}

		dragging = false
		const next = snapDetentIndex(host.translateY, vy, sorted, vh())
		if (next < 0) {
			animateTo(vh(), closeNow)
		} else {
			cur = next
			animateTo(detentOffset(sorted, cur, vh()))
		}
	}

	const onPan = (e: any) => {
		if (e.state === 1) {
			// began
			dragging = true
			dy0 = e.deltaY
			ty0 = host.translateY
			vy = 0
			lastDy = e.deltaY
			lastT = Date.now()
			return
		}

		if (e.state === 0 || e.state === 3) {
			// cancelled / ended
			end()
			return
		}

		if (!dragging) {
			return
		}

		const now = Date.now()
		const dt = (now - lastT) / 1000
		const inc = e.deltaY - lastDy
		if (dt > 0) {
			vy = vy * 0.7 + (inc / dt) * 0.3
		}

		lastDy = e.deltaY
		lastT = now
		host.translateY = Math.min(Math.max(ty0 + (e.deltaY - dy0), 0), vh())
	}

	grabber.on('pan', onPan)

	return {
		enter: () => {
			// Size the panel now that the host has a parent — grabber row
			// heights and detent fractions resolve against the RootLayout.
			host.height = max * vh()
			host.translateY = vh()
			animateTo(detentOffset(sorted, cur, vh()))
		},
		detach: () => {
			grabber.off('pan', onPan)
			if (grabber.parent === host) {
				host.removeChild?.(grabber)
			}
		},
	}
}
