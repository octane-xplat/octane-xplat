import type { SetTranslate } from '../../props'

/** Imperative translate write on a bound view — the gesture seam. NS
 *  views carry real translateX/translateY properties (dips), so the write
 *  is a direct prop set — synchronous on the UI thread. */
/** Mutable translate fields declared by the runtime view, outside the shared type. */
interface TranslateTarget {
  translateX: number
  translateY: number
}

export const setTranslate: SetTranslate = (view, x = 0, y = 0) => {
  if (!view) {
    return
  }

  const target = view as TranslateTarget
  target.translateX = x
  target.translateY = y
}
