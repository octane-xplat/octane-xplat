# Shared native JSX type facade

New type-only package `@octane-xplat/jsx` owns the shared native JSX contract:
one intrinsic-element vocabulary for iOS, Android, and macOS — the 39
NativeScript-baseline tags, the compiler-produced `#text` node, and the nine
maintained cross-platform extension tags (`cachedimage`, `svgview`,
`xplatvideo`, `nscanvas`, `xplatlottie`, `pager`, `animatedimage`,
`applesigninbutton`, `googlesigninbutton`).

`jsx-runtime`/`jsx-dev-runtime` resolve the same contract under the `default`,
`native`, and `macos` export conditions; conditions bind only the host element
value type — opaque `HostElement` by default, NativeScript `View` under
`native`, the bridged AppKit `NSView` under `macos` (which wins when both
conditions are enabled). The shared declarations carry no `@nativescript/core`
dependency, so macOS consumers resolve without NativeScript.

DOM types stay separate at `@octane-xplat/jsx/dom` (+ `dom/jsx-runtime`,
`dom/jsx-dev-runtime`), re-exporting octane's own DOM JSX surface. Leaf
packages registering elements augment `NativeElements` through
`@octane-xplat/jsx/intrinsics`. No consumers migrate yet — authored pragmas,
renderer intrinsics, and tsconfig `jsxImportSource` settings are unchanged.
