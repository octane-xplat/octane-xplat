export interface SheetDetentsController {
    detach: () => void;
}
/** Drag-to-snap detents on a `.vx-sheet` panel: a self-drawn grabber strip
 *  (the only drag target — it never fights inner scrolling) drives the
 *  panel's translateY; the panel is sized to the largest detent and parked
 *  at the offset for the current one. `closeNow` fires after the dismiss
 *  slide-out — the caller decides what closing means (declarative
 *  `onDismiss` or the `openSheet` resolution). In-window on every target —
 *  the OS detent presentations (UISheetPresentationController /
 *  BottomSheetDialog) host a modal VC/dialog window, not a RootLayout
 *  child, so the snap mechanics stay self-drawn for pixel parity. */
export declare function attachSheetDetents(panel: HTMLElement, detents: readonly number[], closeNow: () => void): SheetDetentsController;
