// @octane-xplat/ui/ios — iOS-authentic widgets. OS chrome is the point:
// these resolve only in native builds (the `ui/ios` subpath has no `web`
// export condition). Use inside `.ios.tsrx`/`.mobile.tsrx` files, or behind
// `isIOS` in native-default code — a shared `.tsrx` that imports this path fails
// the web build on purpose.
//
// Each widget's props type carries the widget's name (UISwitch ↔
// UISwitchProps). `Platform*`/`List*`/`Modal*` types are the value and
// identity contracts the widgets share with each other and with portable
// components; portable components' own props live on the root barrel.

export { UISwitch } from './UISwitch.ios.tsrx'
export { UISlider } from './UISlider.ios.tsrx'
export { UIActivityIndicatorView } from './UIActivityIndicatorView.ios.tsrx'
export { UITableView } from './UITableView.ios.tsrx'
export { UITabBar } from './UITabBar.ios.tsrx'
export { UIModal } from './UIModal.ios.tsrx'
export { openModal } from './openModal.ios'
export { SideDrawer } from './SideDrawer.ios.tsrx'
export { LiquidGlass } from './LiquidGlass.ios.tsrx'
export { LiquidGlassContainer } from './LiquidGlassContainer.ios.tsrx'
export { PlatformIcon } from './icon.ios'
export { modifier } from '../modifier-factories'

export type {
	UISwitchProps,
	UISliderProps,
	UIActivityIndicatorViewProps,
	UITableViewProps,
	UITableViewHandle,
	UITabBarProps,
	UIModalProps,
	SideDrawerProps,
	LiquidGlassProps,
	LiquidGlassContainerProps,
	GlassConfig,
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
