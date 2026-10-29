// @octane-xplat/ui/macos — AppKit-only contracts kept off the shared root so
// `@octane-xplat/ui` exports the same names on every target. This subpath
// resolves only under the `macos` export condition; import it from `.macos.*`
// leaves.
export { CameraView } from '@octane-xplat/camera'
export type { CameraAccessibilityRole, CameraViewHandle, CameraViewProps } from '@octane-xplat/camera'
export { bottomSheetHost } from '../components/overlays/bottom-sheet-service.macos'
export { defineAppKitTransition } from '../routing/appkit-route-transition.macos'
export type { AppKitTransitionOptions, AppKitTransitionValues } from '../props'
export { useOutlineFromView, getOutlineFromViewCapabilities } from '../components/collections/outline-view.macos.tsrx'
