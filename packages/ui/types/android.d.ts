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
	RefreshProps,
	SwitchProps,
	SliderProps,
	TabsProps,
	TabSpec,
} from './props'

export type {
	ActivityIndicatorProps,
	DrawerProps,
	ListProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	RefreshProps,
	SwitchProps,
	SliderProps,
	TabsProps,
	TabSpec,
} from './props'

/** Material SwitchMaterial via NativeScript `switch`. */
export declare const MaterialSwitch: UniversalComponent<SwitchProps>
/** Android SeekBar via NativeScript `slider`. */
export declare const SeekBar: UniversalComponent<SliderProps>
/** Android indeterminate ProgressBar via NativeScript `activityindicator`. */
export declare const CircularProgressIndicator: UniversalComponent<ActivityIndicatorProps>
/** Android RecyclerView via NativeScript `listview` — recycled platform list. */
export declare const RecyclerView: UniversalComponent<ListProps>
/** Android bottom navigation via NativeScript TabView. `stack` panes host
 *  a Frame for chrome, but pushes stay in the route store and render
 *  through RouteHost — Frame-in-TabViewItem bookkeeping is unreliable
 *  upstream (NativeScript#11444; the #11446 fix ships in the xplat core
 *  patch). Same push/pop/`useRoute` contract as the shared `Tabs`. */
export declare const BottomNavigationView: UniversalComponent<TabsProps>
/** Platform modal presentation (`showModal`; fullscreen=false → dialog). */
export declare const MaterialDialog: UniversalComponent<ModalProps>
export declare const openModal: OpenModal
/** AndroidX DrawerLayout via the ui-drawer plugin. */
export declare const DrawerLayout: UniversalComponent<DrawerProps>
