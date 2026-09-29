import type { PlatformTabsProps, PlatformWidgetProps } from '../props.js';
export type { PlatformTabSpec as TabSpec } from '../props.js';
/**  BottomNavigationView — the platform tab bar (Android bottom navigation
 *  via NativeScript TabView). Each `stack` pane hosts a Frame for the tab's
 *  chrome, but pushes stay in the route store and render through RouteHost —
 *  TabViewItem-hosted Frames lose navigation bookkeeping upstream
 *  (NativeScript#11444; the #11446 fix ships in the xplat core patch).
 *  `tabs` is identity-stable. */
export declare function BottomNavigationView(props: PlatformWidgetProps<PlatformTabsProps>): unknown;
