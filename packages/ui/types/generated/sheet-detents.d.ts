export interface SheetDetentsController {
    /** Slide the panel in from below the screen edge — call once the host
     *  is inside the RootLayout (the RootLayout open call replaces the
     *  built-in enter/exit animation, which would fight detent offsets:
     *  it always animates translateY to 0). */
    enter: () => void;
    detach: () => void;
}
/** Drag-to-snap detents on a RootLayout sheet host: a self-drawn grabber
 *  strip (top-aligned grid child — the only drag target, so it never
 *  fights inner scrolling) drives the host's translateY; the host is
 *  sized to the largest detent and parked at the offset for the current
 *  one. `closeNow` fires after the dismiss slide-out — the caller decides
 *  what closing means (declarative `onDismiss` via RootLayout 'closed',
 *  or the `openSheet` resolution).
 *
 *  In-window on native: the OS detent presentations
 *  (UISheetPresentationController / BottomSheetBehavior via
 *  BottomSheetDialogFragment) host a modal VC or a separate dialog
 *  window — a different surface contract than the RootLayout child this
 *  sheet is (UIModal/MaterialDialog own the modal path), so the snap
 *  mechanics are self-drawn and identical to the web leaf. */
export declare function attachSheetDetents(host: any, detents: readonly number[], closeNow: () => void): SheetDetentsController;
