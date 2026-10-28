### Correct AppKit scrolling coordinates

AppKit scroll offsets and measurements now read the native view's `flipped`
property. ScrollableArea, VirtualList and chat share clamped top-based seeks,
retain omitted axes and fall back to an immediate seek when animation is
unavailable. Short content stays at offset zero.

The renderer uses the same coordinate property for initial scrolling, pan Y,
anchored layers and gradients. Native interaction, placement, pixels and
packaged behavior still need qualification.

See [macOS scrolling](https://octane-xplat.goddardai.org/app/primitives#macos-scrolling-and-refresh).
