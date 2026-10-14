// @octane-xplat/ui/native — NativeScript integration plumbing shared by iOS
// and Android. This is not part of the cross-platform component barrel.

export { rootLayoutFor, topRootLayout, findInRootLayouts } from '../root-layout'
export { layoutsForRoute } from '../route'
export { bottomSheetHost } from '../bottom-sheet-service'

// Native-view outline discovery — the DOM form lives under `@octane-xplat/ui/web`.
export { useOutlineFromView } from '../outline-view.tsrx'
