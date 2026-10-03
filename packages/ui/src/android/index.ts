// @octane-xplat/ui/android — Android-authentic widgets. OS chrome is the
// point: these resolve only in native builds (the `ui/android` subpath has
// no `web` export condition). Use inside `.android.tsrx`/`.mobile.tsrx`
// files, or behind `isAndroid` in native-default code — a shared `.tsrx` that
// imports this path fails the web build on purpose.

export { MaterialSwitch } from './MaterialSwitch.android.tsrx'
export { SeekBar } from './SeekBar.android.tsrx'
export { CircularProgressIndicator } from './CircularProgressIndicator.android.tsrx'
export { RecyclerView } from './RecyclerView.android.tsrx'
export { BottomNavigationView } from './BottomNavigationView.android.tsrx'
export type { PlatformTabSpec as TabSpec } from '../props'
export { MaterialDialog } from './MaterialDialog.android.tsrx'
export { openModal } from './openModal.android'
export { DrawerLayout } from './DrawerLayout.android.tsrx'
export { Icon } from './icon.android'
export { modifier } from '../modifier-factories'

export type {
	SwitchProps,
	SliderProps,
	ActivityIndicatorProps,
	PlatformListProps as ListProps,
	ListVisibleItem,
	ListViewabilityChange,
	ListViewabilityInfo,
	ListViewabilityConfig,
	PlatformListHandle,
	TabsProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	DrawerProps,
	NativeModifier,
	NativeModifierValue,
	PlatformIconChoice,
	PlatformTabSpec,
	PlatformTabsProps,
	PlatformWidgetProps,
	RefreshProps,
} from '../props'
