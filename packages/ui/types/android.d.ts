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
/** Android bottom navigation via NativeScript TabView. Caveat: `stack`
 *  panes rely on Frame-in-TabViewItem, which is unreliable upstream
 *  (NativeScript#11444) — the shared `Tabs` keeps stack history in the
 *  route store and is the reliable path on Android. */
export declare const BottomNavigationView: UniversalComponent<TabsProps>
/** Platform modal presentation (`showModal`; fullscreen=false → dialog). */
export declare const MaterialDialog: UniversalComponent<ModalProps>
export declare const openModal: OpenModal
/** AndroidX DrawerLayout via the ui-drawer plugin. */
export declare const DrawerLayout: UniversalComponent<DrawerProps>
