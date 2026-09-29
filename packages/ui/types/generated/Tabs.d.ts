import type { TabsProps } from './props.js';
export type { TabSpec } from './props.js';
/**  Self-drawn tab shell — a fixed Pressable row plus a single swapped pane,
 *  identical on every target (the same shape as the web leaf). Route
 *  history for `stack` panes lives in the route store, so switching tabs
 *  keeps each stack's entries; pushed screens render through RouteHost.
 *  The platform tab bar (UITabBar/BottomNavigationView — real UITabBarItem
 *  chrome, per-pane Frames) lives in `ui/ios` + `ui/android`.
 *  `tabs` is identity-stable (module const preferred). */
export declare function Tabs(props: TabsProps): unknown;
