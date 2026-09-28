// @octane-xplat/ui/ios — iOS-authentic widgets. OS chrome is the point:
// these resolve only in native builds (the `ui/ios` subpath has no `web`
// export condition). Use inside `.ios.tsrx`/`.mobile.tsrx` files, or behind
// `isIOS` in native-default code — a shared `.tsrx` that imports this path fails
// the web build on purpose.

export { UISwitch } from './UISwitch.ios.tsrx'
export { UISlider } from './UISlider.ios.tsrx'
export { UIActivityIndicatorView } from './UIActivityIndicatorView.ios.tsrx'
export { UITableView } from './UITableView.ios.tsrx'
export { UITabBar } from './UITabBar.ios.tsrx'
export type { PlatformTabSpec as TabSpec } from '../props'
export { UIModal } from './UIModal.ios.tsrx'
export { openModal } from './openModal.ios'
export { SideDrawer } from './SideDrawer.ios.tsrx'
export { LiquidGlass } from './LiquidGlass.ios.tsrx'
export { LiquidGlassContainer } from './LiquidGlassContainer.ios.tsrx'
export { Icon } from './icon.ios'
export { modifier } from '../modifier-factories'

export type {
	SwitchProps,
	SliderProps,
	ActivityIndicatorProps,
	ListProps,
	TabsProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	DrawerProps,
	LiquidGlassProps,
	LiquidGlassContainerProps,
	GlassConfig,
	NativeModifier,
	NativeModifierValue,
	PlatformIconChoice,
	PlatformTabSpec,
	PlatformTabsProps,
	PlatformWidgetProps,
} from '../props'
