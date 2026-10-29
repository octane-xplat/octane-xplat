// @octane-xplat/ui/nativescript — NativeScript integration plumbing shared by iOS
// and Android. This is not part of the cross-platform component barrel.

export { prepareFullScreenPage } from '../components/layout/full-screen-page'
export { rootLayoutFor, topRootLayout, findInRootLayouts } from '../components/layout/root-layout'
export { bottomSheetHost } from '../components/overlays/bottom-sheet-service'
export { defineNativeTransition } from '../routing/native-route-transition'
export type {
	NativeTransitionContext,
	NativeTransitionOptions,
	NativeViewTransitionOptions,
	NativeViewTransitionValues,
} from '../routing/native-route-transition'

// Native-view outline discovery — the DOM form lives under `@octane-xplat/ui/web`.
export { useOutlineFromView, getOutlineFromViewCapabilities } from '../components/collections/outline-view.tsrx'
