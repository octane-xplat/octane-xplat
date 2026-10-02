import { setTranslate } from './translate.web'
import {
	DETENT_FLICK_VELOCITY,
	detentOffset,
	normalizeDetents,
	snapDetentIndex,
} from './sheet-snap'

const SNAP_MS = 200

export interface SheetDetentsController {
	detach: () => void
}

export interface SheetDetentsOptions {
	/** False blocks the swipe-to-dismiss outcome — a release below the
	 *  smallest stop snaps back instead of closing. */
	dismissible?: boolean
	/** Live translateY updates for scrim-opacity modulation. */
	onOffset?: (offset: number, vh: number) => void
	/** No snap points: the panel keeps its content height and the grabber
	 *  only owns swipe-to-dismiss. */
	swipeOnly?: boolean
}

/** Drag-to-snap detents on a `.vx-sheet` panel: a self-drawn grabber strip
 *  (the only drag target — it never fights inner scrolling) drives the
 *  panel's translateY; the panel is sized to the largest detent and parked
 *  at the offset for the current one. `closeNow` fires after the dismiss
 *  slide-out — the caller decides what closing means (declarative
 *  `onOpenChange` or the `openBottomSheet` resolution). In-window on every target —
 *  the OS detent presentations (UISheetPresentationController /
 *  BottomSheetDialog) host a modal VC/dialog window, not a RootLayout
 *  child, so the snap mechanics stay self-drawn for pixel parity. */
export function attachSheetDetents(
	panel: HTMLElement,
	detents: readonly number[],
	closeNow: () => void,
	options: SheetDetentsOptions = {},
): SheetDetentsController {
	const sorted = normalizeDetents(detents)
	const swipeOnly = options.swipeOnly === true || !sorted.length
	if (!sorted.length && !options.swipeOnly) {
		return { detach: () => {} }
	}

	const vh = () => panel.parentElement?.clientHeight || window.innerHeight || 1
	const max = sorted[sorted.length - 1] ?? 0
	/** Content-sized panels dismiss once the drag covers ~40% of their
	 *  height (or on a downward fling). */
	const panelHeight = () => panel.getBoundingClientRect().height
	const dismissible = () => options.dismissible !== false

	panel.classList.add('vx-sheet-detents')
	// Panel is sized to the largest detent; translateY parks it per detent.
	// swipeOnly keeps the content-sized height.
	if (!swipeOnly) {
		panel.style.height = `${max * 100}%`
	}

	const grabber = document.createElement('div')
	grabber.className = 'vx-sheet-grabber'
	const grip = document.createElement('div')
	grip.className = 'vx-sheet-grip'
	grabber.appendChild(grip)
	panel.appendChild(grabber)

	let cur = 0
	let ty = 0
	let dragging = false
	let y0 = 0
	let ty0 = 0
	let vy = 0
	let lastY = 0
	let lastT = 0

	const applyTy = (value: number) => {
		ty = value
		setTranslate(panel, 0, value)
		options.onOffset?.(value, vh())
	}

	const animateTo = (value: number, then?: () => void) => {
		panel.style.transition = `transform ${SNAP_MS}ms ease-out`
		applyTy(value)
		setTimeout(() => {
			panel.style.transition = ''
			then?.()
		}, SNAP_MS)
	}

	const down = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' && e.button !== 0) {
			return
		}

		dragging = true
		grabber.setPointerCapture?.(e.pointerId)
		y0 = e.clientY
		lastY = e.clientY
		lastT = Date.now()
		ty0 = ty
		vy = 0
		panel.style.transition = ''
		e.preventDefault()
	}

	const move = (e: PointerEvent) => {
		if (!dragging) {
			return
		}

		const now = Date.now()
		const dt = (now - lastT) / 1000
		if (dt > 0) {
			// Smoothed velocity — a single noisy event shouldn't fling.
			vy = vy * 0.7 + ((e.clientY - lastY) / dt) * 0.3
		}

		lastY = e.clientY
		lastT = now
		applyTy(Math.min(Math.max(ty0 + (e.clientY - y0), 0), vh()))
		e.preventDefault()
	}

	const up = () => {
		if (!dragging) {
			return
		}

		dragging = false
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

	// `.vx-sheet` scrolls its own overflow — the grabber is absolutely
	// positioned against the content box, so pin it to the scrollport top
	// while the panel scrolls (same floating-overlay shape as native).
	const pinGrabber = () => {
		grabber.style.top = `${panel.scrollTop}px`
	}

	panel.addEventListener('scroll', pinGrabber)
	grabber.addEventListener('pointerdown', down)
	grabber.addEventListener('pointermove', move)
	grabber.addEventListener('pointerup', up)
	grabber.addEventListener('pointercancel', up)

	// Slide in from below the screen edge, matching the native leaf's
	// translateY = vh → resting enter animation.
	applyTy(vh())
	const raf = requestAnimationFrame(() =>
		animateTo(swipeOnly ? 0 : detentOffset(sorted, cur, vh())),
	)

	return {
		detach: () => {
			cancelAnimationFrame(raf)
			panel.removeEventListener('scroll', pinGrabber)
			grabber.removeEventListener('pointerdown', down)
			grabber.removeEventListener('pointermove', move)
			grabber.removeEventListener('pointerup', up)
			grabber.removeEventListener('pointercancel', up)
			grabber.remove()
			panel.classList.remove('vx-sheet-detents')
			if (!swipeOnly) {
				panel.style.height = ''
			}

			panel.style.transition = ''
		},
	}
}
