// Boundary types for @octane-xplat/ui/ios — iOS-authentic widgets. OS
// chrome is the point; the self-drawn shared versions live in the root
// export. This subpath resolves only under the `native` condition.

import type { UniversalComponent } from 'octane/universal'
import type {
	ActivityIndicatorProps,
	DrawerProps,
	ListProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	SwitchProps,
	SliderProps,
	TabsProps,
	TabSpec,
	LiquidGlassProps,
	LiquidGlassContainerProps,
} from './props'

export type {
	ActivityIndicatorProps,
	DrawerProps,
	GlassConfig,
	ListProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	SwitchProps,
	SliderProps,
	TabsProps,
	TabSpec,
	LiquidGlassProps,
	LiquidGlassContainerProps,
} from './props'

/** UIKit UISwitch via NativeScript `switch`. */
export declare const UISwitch: UniversalComponent<SwitchProps>
/** UIKit UISlider via NativeScript `slider`. */
export declare const UISlider: UniversalComponent<SliderProps>
/** UIKit UIActivityIndicatorView via NativeScript `activityindicator`. */
export declare const UIActivityIndicatorView: UniversalComponent<ActivityIndicatorProps>
/** UIKit UITableView via NativeScript `listview` — recycled platform list. */
export declare const UITableView: UniversalComponent<ListProps>
/** UITabBarController-backed TabView — per-pane Frames for `stack` tabs. */
export declare const UITabBar: UniversalComponent<TabsProps>
/** Platform modal presentation (`showModal`; fullscreen=false → form sheet). */
export declare const UIModal: UniversalComponent<ModalProps>
export declare const openModal: OpenModal
/** ui-drawer edge-gesture drawer (iOS has no OS drawer widget). */
export declare const SideDrawer: UniversalComponent<DrawerProps>
/** iOS 26+ UIGlassEffect surface; inert layout on older iOS. */
export declare const LiquidGlass: UniversalComponent<LiquidGlassProps>
/** iOS 26+ UIGlassContainerEffect merged-glass region. */
export declare const LiquidGlassContainer: UniversalComponent<LiquidGlassContainerProps>
