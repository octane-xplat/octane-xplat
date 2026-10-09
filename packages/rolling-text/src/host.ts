import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'
import { Application } from '@nativescript/core'

const platform = globalThis as any

// Same monotonic preference order as @octane-xplat/motion's clock: media time
// on iOS, nanotime on Android, wall clock elsewhere. The fallbacks read the
// live globals per call so test fake clocks (and NS's own __time) apply.
const now: () => number = Application.ios
	? platform.CACurrentMediaTime
		? () => platform.CACurrentMediaTime() * 1000
		: () => (platform.__time ? platform.__time() : Date.now())
	: platform.java?.lang?.System
		? () => platform.java.lang.System.nanoTime() / 1e6
		: () => Date.now()

export const frame = {
	now,
	request: (callback: () => void) => requestAnimationFrame(callback) as any,
	cancel: (id: number) => cancelAnimationFrame(id),
}

/** Clip the roll inside the row's one-line bounds. iOS UIView clipsToBounds
 *  defaults false (DOM/NS overflow:visible is the norm); Android ViewGroups
 *  clip children by default. */
export function clipRow(view: any): void {
	if (Application.ios && view?.ios) {
		view.ios.clipsToBounds = true
	}
}

/** Laid-out height in dips; 0 before the first layout pass. */
export function viewHeight(view: any): number {
	return view?.getActualSize?.().height ?? 0
}

/** Direct view-property writes — the roll never re-renders per frame. */
export function writeCell(view: any, y: number, opacity: number): void {
	if (!view) {
		return
	}

	view.translateY = y
	view.opacity = opacity
}
