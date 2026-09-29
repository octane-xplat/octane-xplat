export interface RefreshConfig {
    onRefresh?: () => void;
    refreshing?: boolean;
    threshold?: number;
}
export interface RefreshHost {
    /** The scrolling view — NS ScrollView or ListView. */
    scroller: any;
    /** The overlay strip (owns the self-drawn spinner), translated in/out. */
    indicator: any;
    /** True when the scroller is resting at its top edge (Android only —
     *  iOS reads the overscroll directly from contentOffset). */
    isAtTop: () => boolean;
    /** Latest props — a ref so callback identity churn can't re-attach. */
    cfg: {
        current: RefreshConfig;
    };
}
export interface RefreshController {
    /** Call when `refreshing` changes — docks/undocks the indicator. */
    sync: () => void;
    detach: () => void;
}
/** Pan-driven pull-to-refresh over any NS scrollable (scrollview or
 *  listview). Two mechanics, one visual:
 *
 *  iOS — UIScrollView's own bounce supplies the content displacement
 *  (NS gesture delegates allow simultaneous recognition, so our pan on
 *  the scroller observes alongside the scroll pan). The handler reads
 *  `contentOffset` for the live gap and docks with
 *  `contentInset.top += H` — the exact mechanics UIRefreshControl uses.
 *
 *  Android — there is no overscroll; the scroller box itself is
 *  translated inside the clipping wrapper while the damped drag
 *  accumulates. Docking holds the translate at H. Edge glow is disabled
 *  (OVER_SCROLL_NEVER) so no OS chrome leaks into the pixels.
 *
 *  Releasing past `threshold` fires `onRefresh` once per pull and holds
 *  the docked gap; the controlled `refreshing` prop keeps it docked.
 *  A short grace window collapses the dock if `refreshing` never comes —
 *  props land a render after `onRefresh` fires. */
export declare function createPullToRefresh(host: RefreshHost): RefreshController;
