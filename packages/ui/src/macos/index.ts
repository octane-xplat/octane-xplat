// @octane-xplat/ui/macos — AppKit-only contracts kept off the shared root so
// `@octane-xplat/ui` exports the same names on every target. This subpath
// resolves only under the `macos` export condition; import it from `.macos.*`
// leaves.
export { CameraView } from '../hosted-unsupported.macos.tsrx'
export { bottomSheetHost } from '../bottom-sheet-service.macos'
export { useOutlineFromView } from '../outline-view.macos.tsrx'
