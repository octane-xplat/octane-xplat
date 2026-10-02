import { isIOS } from '@nativescript/core'
import { REFRESH_HEADER_HEIGHT, dampenPull } from './refresh-metrics'

export interface RefreshConfig {
	onRefresh?: () => void
	refreshing?: boolean
	threshold?: number
}

export interface RefreshHost {
	/** The scrolling view — NS ScrollView or ListView. */
	scroller: any
	/** The overlay strip (owns the self-drawn spinner), translated in/out. */
	indicator: any
	/** True when the scroller is resting at its top edge (Android only —
	 *  iOS reads the overscroll directly from contentOffset). */
	isAtTop: () => boolean
	/** Latest props — a ref so callback identity churn can't re-attach. */
	cfg: { current: RefreshConfig }
}

export interface RefreshController {
	/** Call when `refreshing` changes — docks/undocks the indicator. */
	sync: () => void
	detach: () => void
}

const PAN_ENDED = new Set([0, 3]) // GestureStateTypes cancelled / ended
const DOCK_ANIM_MS = 180

/* UIEdgeInsetsMake is a UIKit inline function — reach it through
 * globalThis so nothing references NS globals at module scope. */
function makeInsets(top: number, left: number, bottom: number, right: number) {
	const make = (globalThis as any).UIEdgeInsetsMake
	if (make) {
		return make(top, left, bottom, right)
	}

	return { top, left, bottom, right }
}

/** Pan-driven pull-to-refresh over any NS scrollable (scrollview or
 *  listview). Two mechanics, one visual:
 *
 *  iOS — UIScrollView's own bounce supplies the content displacement
 *  (NS gesture delegates allow simultaneous recognition, so our pan on
 *  the scroller observes alongside the scroll pan). The handler reads
 *  `contentOffset` for the live gap and docks with
 *  `contentInset.top += H` — the exact mechanics UIRefreshControl uses.
 *
 *  Android — there is no overscroll; the scroller box itself is
 *  translated inside the clipping wrapper while the damped drag
 *  accumulates. Docking holds the translate at H. Edge glow is disabled
 *  (OVER_SCROLL_NEVER) so no OS chrome leaks into the pixels.
 *
 *  Releasing past `threshold` fires `onRefresh` once per pull and holds
 *  the docked gap; the controlled `refreshing` prop keeps it docked.
 *  A short grace window collapses the dock if `refreshing` never comes —
 *  props land a render after `onRefresh` fires. */
export function createPullToRefresh(host: RefreshHost): RefreshController {
	const { scroller, indicator, isAtTop, cfg } = host
	if (!scroller || !indicator) {
		return { sync: () => {}, detach: () => {} }
	}

	let docked = false // gesture-driven dock at REFRESH_HEADER_HEIGHT
	let pullAcc = 0 // android: damped accumulation beyond the held baseline
	let prevDy = 0
	let touching = false // a pan gesture is in flight
	let grace: any = null
	let baseInsetTop: number | null = null
	let lastTy = Number.NaN

	const threshold = () => cfg.current.threshold ?? REFRESH_HEADER_HEIGHT
	/** Resting gap: the strip stays docked while the gesture docked it OR
	 *  the controlled `refreshing` prop holds it open. */
	const held = () => docked || !!cfg.current.refreshing

	/* iOS: distance the content hangs below its resting top edge — 0 at
	 * rest whether docked or not, so the held gap is added back by the
	 * caller. */
	const iosOverscroll = () => {
		const sv = scroller.ios
		if (!sv?.contentOffset) {
			return 0
		}

		return Math.max(0, -(sv.contentOffset.y + sv.contentInset.top))
	}

	const applyReveal = (reveal: number) => {
		const ty = reveal - REFRESH_HEADER_HEIGHT
		if (ty !== lastTy) {
			lastTy = ty
			indicator.translateY = ty
			if (!isIOS) {
				scroller.translateY = reveal
			}
		}
	}

	const settle = (reveal: number) => {
		lastTy = Number.NaN // animate() owns translateY now
		if (isIOS) {
			animateTo(indicator, reveal - REFRESH_HEADER_HEIGHT)
		} else {
			animateTo(scroller, reveal)
			animateTo(indicator, reveal - REFRESH_HEADER_HEIGHT)
		}
	}

	const setInset = (on: boolean) => {
		const sv = scroller.ios
		if (!sv?.contentInset) {
			return
		}

		if (on && baseInsetTop == null) {
			baseInsetTop = sv.contentInset.top
		}

		const next = (baseInsetTop ?? 0) + (on ? REFRESH_HEADER_HEIGHT : 0)
		if (Math.abs(sv.contentInset.top - next) < 0.5) {
			return
		}

		const apply = () => {
			sv.contentInset = makeInsets(
				next,
				sv.contentInset.left,
				sv.contentInset.bottom,
				sv.contentInset.right,
			)
		}

		const UIView = (globalThis as any).UIView
		if (UIView?.animateWithDurationAnimations) {
			UIView.animateWithDurationAnimations(DOCK_ANIM_MS / 1000, apply)
		} else {
			apply()
		}
	}

	function animateTo(view: any, y: number) {
		view?.animate?.({ translate: { x: 0, y }, duration: DOCK_ANIM_MS })
	}

	const dock = () => {
		docked = true
		pullAcc = 0
		if (isIOS) {
			setInset(true)
		}

		settle(REFRESH_HEADER_HEIGHT)
	}

	const collapse = () => {
		docked = false
		pullAcc = 0
		if (isIOS) {
			setInset(false)
		}

		settle(0)
	}

	/** `extra` is pull beyond the held baseline — a release only fires
	 *  `onRefresh` when the user actually pulled (a resting release inside
	 *  the dock re-fires nothing). */
	const release = (extra: number) => {
		const reveal = extra + (held() ? REFRESH_HEADER_HEIGHT : 0)
		if (extra > 0 && reveal >= threshold()) {
			cfg.current.onRefresh?.()
			dock()
			clearTimeout(grace)
			grace = setTimeout(() => {
				if (!cfg.current.refreshing) {
					collapse()
				}
			}, 350)
		} else if (held()) {
			// A `refreshing`-driven dock deferred while the finger was down
			// applies now; gesture-driven docks just settle back.
			docked = true
			pullAcc = 0
			if (isIOS) {
				setInset(true)
			}

			settle(REFRESH_HEADER_HEIGHT)
		} else {
			collapse()
		}
	}

	const onPan = (e: any) => {
		if (isIOS) {
			// Clamped: once the user scrolls down past the held gap the
			// indicator stays pinned — the dock is header-fixed, not a
			// content row (uniform with the Android/web overlay).
			const extra = iosOverscroll()
			if (PAN_ENDED.has(e.state)) {
				touching = false
				release(extra)
			} else {
				touching = true
				applyReveal(extra + (held() ? REFRESH_HEADER_HEIGHT : 0))
			}

			return
		}

		if (e.state === 1) {
			touching = true
			prevDy = e.deltaY
			pullAcc = 0
			return
		}

		if (PAN_ENDED.has(e.state)) {
			touching = false
			release(pullAcc)
			pullAcc = 0
			return
		}

		const inc = e.deltaY - prevDy
		prevDy = e.deltaY
		if (!isAtTop()) {
			return
		}

		pullAcc = Math.max(0, pullAcc + dampenPull(inc))
		applyReveal(pullAcc + (held() ? REFRESH_HEADER_HEIGHT : 0))
	}

	// `view.on('pan')` routes through NS's gesture observer; the recognizer
	// attaches when the view loads. iOS marks NS recognizers as simultaneous
	// with the scroll view's own pan, so it fires alongside scrolling.
	scroller.on('pan', onPan)
	// Kill Android's overscroll edge glow — OS chrome breaks the parity
	// contract. 2 = android.view.View.OVER_SCROLL_NEVER.
	if (!isIOS) {
		scroller.android?.setOverScrollMode?.(2)
	}

	return {
		sync: () => {
			if (cfg.current.refreshing) {
				clearTimeout(grace)
				// Defer the dock while a gesture is in flight — release()
				// applies it when the finger lifts.
				if (!docked && !touching) {
					dock()
				}
			} else if (docked && !touching) {
				collapse()
			}
		},
		detach: () => {
			clearTimeout(grace)
			scroller.off('pan', onPan)
			if (docked) {
				docked = false
				if (isIOS) {
					setInset(false)
				} else {
					scroller.translateY = 0
				}

				indicator.translateY = -REFRESH_HEADER_HEIGHT
			}
		},
	}
}
