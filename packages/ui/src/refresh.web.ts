import { REFRESH_HEADER_HEIGHT, dampenPull } from './refresh-metrics'
import { setTranslate } from './translate.web'

export interface RefreshConfig {
	onRefresh?: () => void
	refreshing?: boolean
	threshold?: number
}

export interface RefreshController {
	/** Call when `refreshing` changes — docks/undocks the indicator. */
	sync: () => void
	detach: () => void
}

const DOCK_ANIM_MS = 180

/** Pointer/touch-driven pull-to-refresh for the DOM leaf — the web has no
 *  native overscroll, so drag distance translates the scroller inside the
 *  clipped wrapper while the self-drawn indicator slides into the gap.
 *  `touchmove` must be non-passive: `preventDefault` is what keeps the
 *  browser from taking the gesture as a scroll (or Chrome's own
 *  pull-to-refresh on Android). Mouse drags ride the pointer events. */
export function createPullToRefresh(host: {
	scroller: HTMLElement | null
	indicator: HTMLElement | null
	cfg: { current: RefreshConfig }
}): RefreshController {
	const { scroller, indicator, cfg } = host
	if (!scroller || !indicator) {
		return { sync: () => {}, detach: () => {} }
	}

	let pulling = false
	let y0 = 0
	let pull = 0 // displacement beyond the held baseline
	let docked = false // gesture-driven dock at REFRESH_HEADER_HEIGHT
	let grace: ReturnType<typeof setTimeout> | null = null

	const threshold = () => cfg.current.threshold ?? REFRESH_HEADER_HEIGHT
	/** Resting gap: the strip stays docked while the gesture docked it OR
	 *  the controlled `refreshing` prop holds it open. */
	const held = () => docked || !!cfg.current.refreshing

	const applyReveal = (reveal: number) => {
		setTranslate(indicator, 0, reveal - REFRESH_HEADER_HEIGHT)
		setTranslate(scroller, 0, reveal)
	}

	const settle = (reveal: number) => {
		for (const el of [scroller, indicator]) {
			el.style.transition = `transform ${DOCK_ANIM_MS}ms ease-out`
		}

		applyReveal(reveal)
		setTimeout(() => {
			for (const el of [scroller, indicator]) {
				el.style.transition = ''
			}
		}, DOCK_ANIM_MS)
	}

	const dock = () => {
		docked = true
		pull = 0
		settle(REFRESH_HEADER_HEIGHT)
	}

	const collapse = () => {
		docked = false
		pull = 0
		settle(0)
	}

	/** `pull` is drag distance beyond the held baseline — a release only
	 *  fires `onRefresh` when the user actually pulled (a resting release
	 *  inside the dock re-fires nothing). */
	const release = () => {
		pulling = false
		const reveal = pull + (held() ? REFRESH_HEADER_HEIGHT : 0)
		if (pull > 0 && reveal >= threshold()) {
			cfg.current.onRefresh?.()
			dock()
			if (grace) {
				clearTimeout(grace)
			}

			grace = setTimeout(() => {
				if (!cfg.current.refreshing) {
					collapse()
				}
			}, 350)
		} else if (held()) {
			// A `refreshing`-driven dock deferred while the pointer was down
			// applies now; gesture-driven docks just settle back.
			docked = true
			pull = 0
			settle(REFRESH_HEADER_HEIGHT)
		} else {
			collapse()
		}
	}

	const begin = (y: number, prevent?: () => void) => {
		if (scroller.scrollTop > 0) {
			return
		}

		pulling = true
		y0 = y
		pull = 0
		prevent?.()
	}

	const move = (y: number, prevent: () => void) => {
		if (!pulling) {
			return
		}

		const dy = y - y0
		if (dy <= 0 || scroller.scrollTop > 0) {
			pulling = false
			pull = 0
			applyReveal(held() ? REFRESH_HEADER_HEIGHT : 0)
			return
		}

		prevent()
		pull = dampenPull(dy)
		applyReveal(pull + (held() ? REFRESH_HEADER_HEIGHT : 0))
	}

	const end = () => {
		if (pulling) {
			release()
		}
	}

	const touchStart = (e: TouchEvent) => begin(e.touches[0].clientY)
	const touchMove = (e: TouchEvent) => move(e.touches[0].clientY, () => e.preventDefault())
	const touchEnd = () => end()
	// pointer events cover mouse/pen drags — touch is handled by the touch
	// listeners above since pointermove cannot preventDefault a native pan.
	const pointerDown = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' && e.button === 0) {
			begin(e.clientY, () => e.preventDefault())
		}
	}

	const pointerMove = (e: PointerEvent) => {
		if (e.pointerType === 'mouse') {
			move(e.clientY, () => e.preventDefault())
		}
	}

	const pointerUp = (e: PointerEvent) => {
		if (e.pointerType === 'mouse') {
			end()
		}
	}

	scroller.addEventListener('touchstart', touchStart, { passive: true })
	scroller.addEventListener('touchmove', touchMove, { passive: false })
	scroller.addEventListener('touchend', touchEnd)
	scroller.addEventListener('touchcancel', touchEnd)
	scroller.addEventListener('pointerdown', pointerDown)
	scroller.addEventListener('pointermove', pointerMove)
	scroller.addEventListener('pointerup', pointerUp)
	scroller.addEventListener('pointercancel', pointerUp)

	return {
		sync: () => {
			if (cfg.current.refreshing) {
				if (grace) {
					clearTimeout(grace)
				}

				// Defer the dock while a gesture is in flight — release()
				// applies it when the pointer lifts.
				if (!docked && !pulling) {
					dock()
				}
			} else if (docked && !pulling) {
				collapse()
			}
		},
		detach: () => {
			if (grace) {
				clearTimeout(grace)
			}

			scroller.removeEventListener('touchstart', touchStart)
			scroller.removeEventListener('touchmove', touchMove)
			scroller.removeEventListener('touchend', touchEnd)
			scroller.removeEventListener('touchcancel', touchEnd)
			scroller.removeEventListener('pointerdown', pointerDown)
			scroller.removeEventListener('pointermove', pointerMove)
			scroller.removeEventListener('pointerup', pointerUp)
			scroller.removeEventListener('pointercancel', pointerUp)
			scroller.style.transition = ''
			indicator.style.transition = ''
			applyReveal(0)
		},
	}
}
