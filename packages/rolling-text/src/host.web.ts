export const frame = {
	now: () => performance.now(),
	request: (callback: () => void) => requestAnimationFrame(callback) as any,
	cancel: (id: number) => cancelAnimationFrame(id),
}

/** Web clips with CSS overflow on the row element — nothing to apply. */
export function clipRow(_el: any): void {}

/** Laid-out height in CSS pixels; 0 before layout (jsdom reports 0). */
export function viewHeight(el: any): number {
	return el?.getBoundingClientRect?.().height ?? 0
}

/** Direct style writes — the roll never re-renders per frame. At rest the
 *  properties clear so cell elements carry no residual inline style. */
export function writeCell(el: any, y: number, opacity: number): void {
	if (!el) {
		return
	}

	el.style.transform = y === 0 ? '' : `translateY(${y}px)`
	el.style.opacity = opacity === 1 ? '' : String(opacity)
}
