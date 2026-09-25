import type { SetTranslate } from './props';

/** Imperative translate write on a bound view — the gesture seam. NS
 *  views carry real translateX/translateY properties (dips), so the write
 *  is a direct prop set — synchronous on the UI thread. */
export const setTranslate: SetTranslate = (view, x = 0, y = 0) => {
	if (!view) {
		return;
	}

	view.translateX = x;
	view.translateY = y;
};
