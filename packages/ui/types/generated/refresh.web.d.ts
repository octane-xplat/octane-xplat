export interface RefreshConfig {
    onRefresh?: () => void;
    refreshing?: boolean;
    threshold?: number;
}
export interface RefreshController {
    /** Call when `refreshing` changes — docks/undocks the indicator. */
    sync: () => void;
    detach: () => void;
}
/** Pointer/touch-driven pull-to-refresh for the DOM leaf — the web has no
 *  native overscroll, so drag distance translates the scroller inside the
 *  clipped wrapper while the self-drawn indicator slides into the gap.
 *  `touchmove` must be non-passive: `preventDefault` is what keeps the
 *  browser from taking the gesture as a scroll (or Chrome's own
 *  pull-to-refresh on Android). Mouse drags ride the pointer events. */
export declare function createPullToRefresh(host: {
    scroller: HTMLElement | null;
    indicator: HTMLElement | null;
    cfg: {
        current: RefreshConfig;
    };
}): RefreshController;
