# @octane-xplat/css-engine

> NativeScript-compatible stylesheet engine shared by the Octane desktop renderers (internal; no stable public API)

The NativeScript-compatible stylesheet engine shared by the Octane desktop
renderers: the vendored NativeScript 9.1.3 CSS selector engine and cascade,
plus keyframe, transform, and clip-path parsing. It is consumed by
`@octane-xplat/macos-appkit` (AppKit) and the GTK renderer
(`@octane-xplat/linux-gtk`), each of which supplies its own node adapter.

This package is internal to the framework. Its exports are not a stable
public API and may change without notice.

App authors do not need to install or import this package directly. Use the
shared [styling guide](../app/styling.md) and the renderer package for your target.

[Generated API reference](https://octane-xplat.goddardai.org/api-css-engine).
