// @octane-xplat/ui/linux — Linux-only contracts kept off the shared root so
// `@octane-xplat/ui` exports the same names on every target. This subpath
// resolves only under the `linux` export condition; import it from `.linux.*`
// leaves. The root barrel's `openWindow` returns this handle on the GTK host.
export type { LinuxWindowHandle } from '../internal/platform/windows.linux'
