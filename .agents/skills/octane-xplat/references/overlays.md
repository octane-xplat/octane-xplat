# Overlays — Sheet, Overlay, and platform modals

The shared root package exports self-drawn `Sheet`, `Overlay`, and
`Popover` components plus `openSheet`/`closeSheet`. Modal widgets with OS
chrome are platform-authentic subpath exports.

## Platform modal widgets

`UIModal` + `openModal` are exported from `@octane-xplat/ui/ios`;
`MaterialDialog` + `openModal` are exported from
`@octane-xplat/ui/android`. There is no shared `Modal` or `openModal` export.
Both native APIs mount content in a separate root, so context and theme
classes do not cross from the presenter (see styling/root-boundaries.md).
For a shared in-window surface, compose `Sheet`, `Overlay`, or `Popover`.

## `openSheet(Component, props)` / `closeSheet()`

`openSheet(Component, props)` is a real implementation on both targets.
Native mounts a bottom-docked host in `RootLayout`; web creates a portal
layer under `document.body` and renders the component in its own Octane root.
The web backdrop dismisses the sheet, and the returned promise resolves when
it closes. Content is parameterized, so any component can render in the sheet.

## `openOverlay()` / `closeOverlay()`

The app harness's `openOverlay()` service uses a dedicated `RootLayout` host
on native and a portal layer on web. It provides a floating overlay with a
shade; `Sheet` is bottom-anchored. The shared component exports are
`Overlay` and `Popover`.

## `RootLayout.open()` promises

`RootLayout.open()` returns a Promise. Handle its rejection so an open failure
does not become an unhandled exception. When reusing a host that may still be
attached, close or detach it before opening again; newly created sheet hosts
do not need that reuse check.

## getRootLayout()

Works because `Screen` renders a `RootLayout` on native. `getRootLayout()`
returns null before the first screen mounts — guard it.
