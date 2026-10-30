import {
	DETENT_FLICK_VELOCITY,
	detentOffset,
	normalizeDetents,
	snapDetentIndex,
} from './sheet-snap'

const SNAP_MS = 200

export interface SheetDetentsController {
	/** Slide the panel in from below the window edge — call once the panel
	 *  is inside the overlay layer's target. */
	enter: () => void
	detach: () => void
}

export interface SheetDetentsOptions {
	/** False blocks the swipe-to-dismiss outcome (Astryx 'required' sheets) —
	 *  a release below the smallest stop snaps back instead of closing. */
	dismissible?: boolean
	/** Live translateY updates for scrim-opacity modulation. */
	onOffset?: (offset: number, vh: number) => void
	/** No snap points: the panel keeps its content height and the grabber
	 *  only owns swipe-to-dismiss (release below ~40% of the panel or a
	 *  downward fling). */
	swipeOnly?: boolean
}

/** Drag-to-snap detents on an overlay-layer sheet panel, GTK leaf. The
 *  native leaf attaches a gesture to a self-drawn grabber child of a
 *  RootLayout GridLayout; here the declarative leaf renders the grabber
 *  row itself and hands both views in. The renderer wires 'pan' to
 *  Gtk.GestureDrag ({state:'began'|'moved'|'ended'|'cancelled', cumulative
 *  dx/dy, instantaneous vx/vy px/s}) and `view.animate` is translate-only —
 *  snap/enter/dismiss all write translateY, matching the shared detent
 *  math in sheet-snap.ts. `vh` resolves the window height lazily so the
 *  caller can attach before the first allocation. */
export function attachSheetDetents(
	panel: any,
	grabber: any,
	detents: readonly number[],
	vh: () => number,
	closeNow: () => void,
	options: SheetDetentsOptions = {},
): SheetDetentsController {
	const sorted = normalizeDetents(detents)
	const swipeOnly = options.swipeOnly === true || !sorted.length
	if (!sorted.length && !options.swipeOnly) {
		return { detach: () => {}, enter: () => {} }
	}

	const max = sorted[sorted.length - 1] ?? 0
	/** Content-sized panels dismiss once the drag covers ~40% of their
	 *  height (or on a downward fling). */
	const panelHeight = () =>
		panel.getActualSize?.().height || panel.get_height?.() || 0
	const dismissible = () => options.dismissible !== false

	// The translated-away part is outside the visible stop. Reserve it inside
	// the panel so bottom controls stay inside the current detent's viewport
	// (the native leaf's native-padding lease; GTK composes it on the
	// localStyle channel so later style applies keep the reservation).
	const basePadding = Number(panel.style?.paddingBottom) || 0
	const updateContentInset = (offset: number) => {
		if (swipeOnly) {
			return
		}
		try {
			panel.style.paddingBottom = basePadding + Math.max(0, Math.round(offset))
		} catch { }
	}

	let active = true
	const timers = new Set<ReturnType<typeof setTimeout>>()
	let cur = 0

	// Fully below the window until enter() runs the slide-in.
	try {
		panel.translateY = vh()
	} catch { }

	let dragging = false
	let ty0 = 0
	let vy = 0

	const animateTo = (value: number, then?: () => void) => {
		const complete = () => {
			if (!active) {
				return
			}
			options.onOffset?.(value, vh())
			then?.()
		}
		updateContentInset(value)
		try {
			const done = panel.animate?.({ translate: { x: 0, y: value }, duration: SNAP_MS })
			if (done?.then) {
				void done.then(complete, () => { })
				return
			}
		} catch { }
		panel.translateY = value
		const timer = setTimeout(() => {
			timers.delete(timer)
			complete()
		}, 0)
		timers.add(timer)
	}

	const end = () => {
		if (!dragging) {
			return
		}

		dragging = false
		const ty = Number(panel.translateY) || 0
		if (swipeOnly) {
			if (dismissible() && (vy > DETENT_FLICK_VELOCITY || ty > panelHeight() * 0.4)) {
				animateTo(vh(), closeNow)
			} else {
				animateTo(0)
			}

			return
		}

		const next = snapDetentIndex(ty, vy, sorted, vh())
		if (next < 0) {
			if (dismissible()) {
				animateTo(vh(), closeNow)
			} else {
				animateTo(detentOffset(sorted, cur, vh()))
			}
		} else {
			cur = next
			animateTo(detentOffset(sorted, cur, vh()))
		}
	}

	// GTK dispatches cumulative deltas per drag with NativeScript-style
	// numeric states (began=1, moved=2, ended=3, cancelled=0) — the same
	// shape the shared leaf reads, plus instantaneous px/s velocities.
	const onPan = (e: any) => {
		if (e.state === 1) {
			// began
			dragging = true
			ty0 = Number(panel.translateY) || 0
			vy = 0
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

		vy = vy * 0.7 + (Number(e.vy) || 0) * 0.3
		const next = Math.min(Math.max(ty0 + (Number(e.deltaY ?? e.dy) || 0), 0), vh())
		panel.translateY = next
		updateContentInset(next)
		options.onOffset?.(next, vh())
	}

	grabber?.on?.('pan', onPan)

	return {
		enter: () => {
			if (!active) {
				return
			}
			if (swipeOnly) {
				panel.translateY = vh()
				animateTo(0)
				return
			}

			// Size the panel to the largest stop — the grabber row and detent
			// fractions resolve against the window height.
			try {
				panel.style.height = Math.round(max * vh())
			} catch { }
			panel.translateY = vh()
			animateTo(detentOffset(sorted, cur, vh()))
		},
		detach: () => {
			if (!active) {
				return
			}
			active = false
			for (const timer of timers) {
				clearTimeout(timer)
			}
			timers.clear()
			try {
				panel.style.paddingBottom = basePadding || undefined
			} catch { }
			grabber?.off?.('pan', onPan)
		},
	}
}
