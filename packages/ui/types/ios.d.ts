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
	NativeModifier,
	PlatformIconChoice,
	NativeModifierValue,
	PlatformTabSpec,
	PlatformTabsProps,
	PlatformWidgetProps,
	RefreshProps,
	SwitchProps,
	SliderProps,
	TabsProps,
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
	NativeModifier,
	PlatformIconChoice,
	NativeModifierValue,
	PlatformTabSpec,
	PlatformTabsProps,
	PlatformWidgetProps,
	RefreshProps,
	SwitchProps,
	SliderProps,
	TabsProps,
	LiquidGlassProps,
	LiquidGlassContainerProps,
} from './props'

export type { PlatformTabSpec as TabSpec } from './props'

/** UIKit UISwitch via NativeScript `switch`. */
export declare const UISwitch: UniversalComponent<PlatformWidgetProps<SwitchProps>>
/** UIKit UISlider via NativeScript `slider`. */
export declare const UISlider: UniversalComponent<PlatformWidgetProps<SliderProps>>
/** UIKit UIActivityIndicatorView via NativeScript `activityindicator`. */
export declare const UIActivityIndicatorView: UniversalComponent<PlatformWidgetProps<ActivityIndicatorProps>>
/** UIKit UITableView via NativeScript `listview` — recycled platform list. */
export declare const UITableView: UniversalComponent<PlatformWidgetProps<ListProps>>
/** UITabBarController-backed TabView — per-pane Frames for `stack` tabs. */
export declare const UITabBar: UniversalComponent<PlatformWidgetProps<PlatformTabsProps>>
/** Platform modal presentation (`showModal`; fullscreen=false → form sheet). */
export declare const UIModal: UniversalComponent<ModalProps>
export declare const openModal: OpenModal
/** ui-drawer edge-gesture drawer (iOS has no OS drawer widget). */
export declare const SideDrawer: UniversalComponent<PlatformWidgetProps<DrawerProps>>
/** iOS 26+ UIGlassEffect surface; inert layout on older iOS. */
export declare const LiquidGlass: UniversalComponent<PlatformWidgetProps<LiquidGlassProps>>
/** iOS 26+ UIGlassContainerEffect merged-glass region. */
export declare const LiquidGlassContainer: UniversalComponent<PlatformWidgetProps<LiquidGlassContainerProps>>

export declare const Icon: { select(choice: PlatformIconChoice): string }
export declare const modifier: {
	background(color: string): NativeModifier
	cornerRadius(radius: number): NativeModifier
	opacity(value: number): NativeModifier
	padding(value: number | string): NativeModifier
	frame(width: number | string, height: number | string): NativeModifier
	style(values: Extract<NativeModifier, { type: 'style' }>['values']): NativeModifier
	nativeProperty(name: string, value: NativeModifierValue): NativeModifier
}
