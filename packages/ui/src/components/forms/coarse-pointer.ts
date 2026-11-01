/** Coarse-pointer signal for 'adaptive'/'adaptive-*' presentations
 *  (`resolveInputSurface`, menu sheets). Every NativeScript target is
 *  touch-first, so the shared leaves resolve to the compact surfaces
 *  (sheet / native pickers) there; platform leaves with a real pointer
 *  capability check override this file (menu-sheet.gtk.tsrx precedent). */
export function hasCoarsePointer(): boolean {
	return true
}
