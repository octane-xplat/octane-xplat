# @octane-xplat/css-engine

> NativeScript-compatible stylesheet engine shared by the Octane desktop renderers (internal; no stable public API)

The NativeScript-compatible stylesheet engine shared by the Octane desktop
renderers: the vendored NativeScript 9.1.3 CSS selector engine and cascade,
plus keyframe, transform, and clip-path parsing. It is consumed by
`@octane-xplat/macos-appkit` (AppKit) and the GTK renderer
(`@octane-xplat/linux-gtk`), each of which supplies its own node adapter.

This package is internal to the framework. Its exports are not a stable
public API and may change without notice.

Renderer contributors can normalize an authored inline style before passing it
to their host adapter:

```ts
import { normalizeInlineStyle } from '@octane-xplat/css-engine'

const style = normalizeInlineStyle('opacity: 0.5')
console.log(style?.opacity) // 0.5
```

See [`src/vendor/README.md`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/css-engine/src/vendor/README.md) for the provenance of the
vendored NativeScript selector engine.

[Generated API reference](https://octane-xplat.goddardai.org/api-css-engine).
