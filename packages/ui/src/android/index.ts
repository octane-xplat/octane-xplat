// @octane-xplat/ui/android — Android-authentic widgets. OS chrome is the
// point: these resolve only in native builds (the `ui/android` subpath has
// no `web` export condition). Use inside `.android.tsrx`/`.mobile.tsrx`
// files, or behind `isAndroid` in native-default code — a shared `.tsrx` that
// imports this path fails the web build on purpose.
//
// Each widget's props type carries the widget's name (MaterialSwitch ↔
// MaterialSwitchProps). `Platform*`/`List*`/`Modal*` types are the value and
// identity contracts the widgets share with each other and with portable
// components; portable components' own props live on the root barrel.

export { MaterialSwitch } from './MaterialSwitch.android.tsrx'
export { SeekBar } from './SeekBar.android.tsrx'
export { CircularProgressIndicator } from './CircularProgressIndicator.android.tsrx'
export { RecyclerView } from './RecyclerView.android.tsrx'
export { BottomNavigationView } from './BottomNavigationView.android.tsrx'
export { MaterialDialog } from './MaterialDialog.android.tsrx'
export { openModal } from './openModal.android'
export { DrawerLayout } from './DrawerLayout.android.tsrx'
export { PlatformIcon } from './icon.android'
export { modifier } from '../modifier-factories'

export type {
	MaterialSwitchProps,
	SeekBarProps,
	CircularProgressIndicatorProps,
	RecyclerViewProps,
	RecyclerViewHandle,
	BottomNavigationViewProps,
	MaterialDialogProps,
	DrawerLayoutProps,
	ModalHandle,
	ModalOpenOptions,
	ModalProps,
	ModalOpenResult,
	OpenModal,
	PlatformSwitchProps,
	PlatformListProps,
	PlatformListHandle,
	PlatformTabsProps,
	PlatformTabSpec,
	PlatformIconChoice,
	PlatformWidgetProps,
	RefreshProps,
	ListVisibleItem,
	ListViewabilityChange,
	ListViewabilityInfo,
	ListViewabilityConfig,
	NativeModifier,
	NativeModifierValue,
} from '../props'

export { useImperativeModal } from './use-imperative-modal.android.tsrx'

export { useNativeRouteNavigator } from '../use-native-route-navigator'

export type { ImperativeModalReturn, NativeRouteNavigatorReturn } from '../props'
