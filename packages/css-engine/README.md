# @octane-xplat/css-engine

The NativeScript-compatible stylesheet engine shared by the Octane desktop
renderers: the vendored NativeScript 9.1.3 CSS selector engine and cascade,
plus keyframe, transform, and clip-path parsing. It is consumed by
`@octane-xplat/macos-renderer` (AppKit) and the GTK renderer
(`@octane-xplat/linux-gtk`), each of which supplies its own node adapter.

This package is internal to the framework. Its exports are not a stable
public API and may change without notice.

See [`src/vendor/README.md`](src/vendor/README.md) for the provenance of the
vendored NativeScript selector engine.
