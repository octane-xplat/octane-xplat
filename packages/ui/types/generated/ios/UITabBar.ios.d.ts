import type { PlatformTabsProps, PlatformWidgetProps } from '../props.js';
export type { PlatformTabSpec as TabSpec } from '../props.js';
/**  UITabBar — the platform tab bar (UIKit UITabBarController-backed TabView).
 *  Real per-pane Frames: each `stack` tab keeps a native navigation stack
 *  inside its pane. The self-drawn shared `Tabs` lives in the root export.
 *  `tabs` is identity-stable (module const preferred). */
export declare function UITabBar(props: PlatformWidgetProps<PlatformTabsProps>): unknown;
