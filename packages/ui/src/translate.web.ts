import type { SetTranslate } from './props';
import { writeTransformProp } from './transform.web';

/** Imperative translate write on a bound view — the gesture seam. Called
 *  per frame from pan handlers (docs/animation-gestures.md: animation
 *  writes imperative, state stays declarative). Composes with other
 *  transform writes on the same element via ./transform.web. */
export const setTranslate: SetTranslate = (el, x = 0, y = 0) => {
	if (!el) {
		return;
	}

	writeTransformProp(el, 'translateX', x);
	writeTransformProp(el, 'translateY', y);
};
