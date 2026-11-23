import { Application } from '@nativescript/core'

export { motionClock as frame } from '@octane-xplat/platform/motion-clock'

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
