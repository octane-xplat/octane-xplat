// @octane-xplat/ui/ios — iOS-authentic widgets. OS chrome is the point:
// these resolve only in native builds (the `ui/ios` subpath has no `web`
// export condition). Use inside `.ios.tsrx`/`.native.tsrx` files, or behind
// `isIOS` in `.native` code — a shared `.tsrx` that imports this path fails
// the web build on purpose.

export { UISwitch } from './UISwitch.ios.tsrx'
export { UISlider } from './UISlider.ios.tsrx'
export { UIActivityIndicatorView } from './UIActivityIndicatorView.ios.tsrx'
export { UITableView } from './UITableView.ios.tsrx'
export { UITabBar } from './UITabBar.ios.tsrx'
export type { TabSpec } from './UITabBar.ios.tsrx'
export { UIModal } from './UIModal.ios.tsrx'
export { openModal } from './openModal.ios'
export { SideDrawer } from './SideDrawer.ios.tsrx'
export { LiquidGlass } from './LiquidGlass.ios.tsrx'
export { LiquidGlassContainer } from './LiquidGlassContainer.ios.tsrx'

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
} from '../props'
