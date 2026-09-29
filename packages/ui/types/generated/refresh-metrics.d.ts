/** Pull-to-refresh geometry — one strip height drives the indicator
 *  reveal, the default trigger threshold, and the docked gap on every
 *  target (px on web, dip on native — equal by the dip≈px contract). */
export declare const REFRESH_HEADER_HEIGHT = 64;
/** Finger-travel → content displacement. iOS rubber-band applies ~0.5
 *  resistance at small pulls; web/Android drive the same ratio so the
 *  affordance reads identically across targets. */
export declare function dampenPull(dy: number): number;
