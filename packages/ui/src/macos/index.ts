// @octane-xplat/ui/macos — AppKit-only contracts kept off the shared root so
// `@octane-xplat/ui` exports the same names on every target. This subpath
// resolves only under the `macos` export condition; import it from `.macos.*`
// leaves.
export { CameraView } from '@octane-xplat/camera'
export type { CameraAccessibilityRole, CameraViewHandle, CameraViewProps } from '@octane-xplat/camera'
export { bottomSheetHost } from '../bottom-sheet-service.macos'
export { defineAppKitTransition } from '../appkit-route-transition.macos'
export type { AppKitTransitionOptions, AppKitTransitionValues } from '../props'
export { useOutlineFromView, getOutlineFromViewCapabilities } from '../outline-view.macos.tsrx'
