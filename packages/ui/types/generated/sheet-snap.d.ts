/** Detent math shared by the web/native sheet-detents attachments.
 *  Detents are viewport-height fractions; the panel is sized to the
 *  largest detent and parked at the translateY offset for the current
 *  one, so a snap is just a transform write — no layout thrash. */
/** Downward/upward finger speed (px/s web, dip/s native) that overrides
 *  nearest-detent snapping — a fling snaps one detent in its direction. */
export declare const DETENT_FLICK_VELOCITY = 500;
/** Sorted, filtered, deduped detent fractions. Empty → the caller keeps
 *  the content-sized sheet behavior (detents off). */
export declare function normalizeDetents(input?: readonly number[]): number[];
/** Resting translateY for a detent: the panel is `max * vh` tall, so the
 *  portion below the screen edge is `(max - detent) * vh`. */
export declare function detentOffset(detents: readonly number[], index: number, vh: number): number;
/** Snap target for a release at translateY `ty` with vertical velocity
 *  `vy` (positive = dragging down). Returns the detent index, or -1 to
 *  dismiss: released below half of the smallest detent, or a downward
 *  fling while at/below it. */
export declare function snapDetentIndex(ty: number, vy: number, detents: readonly number[], vh: number): number;
