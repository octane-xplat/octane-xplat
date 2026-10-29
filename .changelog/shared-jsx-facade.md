### Use the shared JSX types on every platform

**Breaking change.** Every Octane Xplat package types its JSX against the type-only facade
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

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import type { View } from '@nativescript/core'

export function NativeLabel() {
	const labelRef = useRef<View | null>(null)
	return <label ref={labelRef} text="Trip details" />
}
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

[JSX configuration and types](https://github.com/octane-xplat/octane-xplat/tree/main/packages/jsx#select-a-jsx-source)
