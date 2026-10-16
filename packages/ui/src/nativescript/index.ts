// @octane-xplat/ui/nativescript — NativeScript integration plumbing shared by iOS
// and Android. This is not part of the cross-platform component barrel.

export { rootLayoutFor, topRootLayout, findInRootLayouts } from '../root-layout'
export { layoutsForRoute } from '../route'
export { bottomSheetHost } from '../bottom-sheet-service'

// Native-view outline discovery — the DOM form lives under `@octane-xplat/ui/web`.
export { useOutlineFromView, getOutlineFromViewCapabilities } from '../outline-view.tsrx'

export { useNativeRouteNavigator } from '../use-native-route-navigator'

export type { NativeRouteNavigatorReturn } from '../props'
