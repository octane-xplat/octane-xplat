# Shared JSX type facade is now the repo-wide JSX vocabulary

Every Octane Xplat package types its JSX against the type-only facade
`@octane-xplat/jsx` (native: iOS/Android/Windows/macOS/GTK) or
`@octane-xplat/jsx/dom` (browser). The renderer pragmas are gone — this is
breaking for any consumer code that still carries them:

```diff
-/** @jsxImportSource @nativescript-community/octane */
+/** @jsxImportSource @octane-xplat/jsx */

-/** @jsxImportSource @octane-xplat/macos-renderer */
+/** @jsxImportSource @octane-xplat/jsx */

-/** @jsxImportSource octane */          // browser file
+/** @jsxImportSource @octane-xplat/jsx/dom */
```

`@octane-xplat/macos-renderer` no longer exports `./intrinsics`,
`./jsx-runtime`, or `./jsx-dev-runtime`.

The shared `HostElement` is now `object`: annotate refs with the concrete
host type where declared instead of casting:

```ts
const ref = useRef<View | null>(null)          // NativeScript leaf
<masonview ref={(view: NSView | null) => view?.layout()} />   // AppKit leaf
```

Leaf element registration moves to the facade intrinsics module:

```ts
declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		mytag: Attributes<TElement, { prop?: string }>
	}
}
```

Layout on intrinsics goes through `style`/`className` only — there are no
layout props on host elements.
