// @octane-xplat/ui/nativescript — NativeScript integration plumbing shared by iOS
// and Android. This is not part of the cross-platform component barrel.

export { prepareFullScreenPage } from '../full-screen-page.mobile'
export { rootLayoutFor, topRootLayout, findInRootLayouts } from '../root-layout'
export { bottomSheetHost } from '../bottom-sheet-service'
export { defineNativeTransition } from '../native-route-transition'
export type {
	NativeTransitionContext,
	NativeTransitionOptions,
	NativeViewTransitionOptions,
	NativeViewTransitionValues,
} from '../native-route-transition'

// Native-view outline discovery — the DOM form lives under `@octane-xplat/ui/web`.
export { useOutlineFromView, getOutlineFromViewCapabilities } from '../outline-view.tsrx'
