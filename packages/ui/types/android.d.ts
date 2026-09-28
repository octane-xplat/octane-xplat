// Boundary types for @octane-xplat/ui/android — Android-authentic widgets.
// OS chrome is the point; the self-drawn shared versions live in the root
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
	NativeModifierValue,
	PlatformIconChoice,
	PlatformTabSpec,
	PlatformTabsProps,
	PlatformWidgetProps,
	RefreshProps,
	SwitchProps,
	SliderProps,
	TabsProps,
} from './props'

export type {
	ActivityIndicatorProps,
	DrawerProps,
	ListProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	NativeModifier,
	NativeModifierValue,
	PlatformIconChoice,
	PlatformTabSpec,
	PlatformTabsProps,
	PlatformWidgetProps,
	RefreshProps,
	SwitchProps,
	SliderProps,
	TabsProps,
} from './props'

export type { PlatformTabSpec as TabSpec } from './props'

/** Material SwitchMaterial via NativeScript `switch`. */
export declare const MaterialSwitch: UniversalComponent<PlatformWidgetProps<SwitchProps>>
/** Android SeekBar via NativeScript `slider`. */
export declare const SeekBar: UniversalComponent<PlatformWidgetProps<SliderProps>>
/** Android indeterminate ProgressBar via NativeScript `activityindicator`. */
export declare const CircularProgressIndicator: UniversalComponent<PlatformWidgetProps<ActivityIndicatorProps>>
/** Android RecyclerView via NativeScript `listview` — recycled platform list. */
export declare const RecyclerView: UniversalComponent<PlatformWidgetProps<ListProps>>
/** Android bottom navigation via NativeScript TabView. `stack` panes host
 *  a Frame for chrome, but pushes stay in the route store and render
 *  through RouteHost — Frame-in-TabViewItem bookkeeping is unreliable
 *  upstream (NativeScript#11444; the #11446 fix ships in the xplat core
 *  patch). Same push/pop/`useRoute` contract as the shared `Tabs`. */
export declare const BottomNavigationView: UniversalComponent<PlatformWidgetProps<PlatformTabsProps>>
/** Platform modal presentation (`showModal`; fullscreen=false → dialog). */
export declare const MaterialDialog: UniversalComponent<ModalProps>
export declare const openModal: OpenModal
/** AndroidX DrawerLayout via the ui-drawer plugin. */
export declare const DrawerLayout: UniversalComponent<PlatformWidgetProps<DrawerProps>>

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
