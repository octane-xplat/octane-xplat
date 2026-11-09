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

CSS variable fallbacks preserve function arguments on desktop. Setting a
variable to `initial` makes its consuming declaration use the fallback;
a missing variable without a fallback invalidates that whole value. Registered
`@property` defaults still need separate host support.

```css
.trip-card {
  --inset: initial;
  padding: var(--inset, 8px);
  color: var(--ink, rgb(17, 34, 51));
}
```

See [`src/vendor/README.md`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/css-engine/src/vendor/README.md) for the provenance of the
vendored NativeScript selector engine.

[Generated API reference](https://octane-xplat.goddardai.org/api-css-engine).
