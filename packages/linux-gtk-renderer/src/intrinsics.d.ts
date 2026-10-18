// The GTK renderer's intrinsic surface is the shared `@octane-xplat/jsx`
// contract bound to `GtkWidget` — re-exported here so the renderer's
// `@jsxImportSource` pragma and the compiler's `intrinsics` module resolve
// the identical membership, prop names, and event surface every platform
// shares. Viewless intrinsics bind to `LogicalElement`; tags the driver does
// not implement fail at mount with a named error, never silently.
export { JSX } from '@octane-xplat/jsx/gtk'
