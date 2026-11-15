# Pretext adapter

`@chenglou/pretext@1.0.0` looks for `OffscreenCanvas`, then a document canvas, and throws if neither can create a 2D context. Its documented non-browser adapter surface is a global `OffscreenCanvas` whose 2D context accepts `font` and returns a finite `measureText(text).width`. The Xplat package installs that small surface from each native platform leaf and delegates text widths to the platform font engine; web keeps the browser canvas.

This is source and API evidence from the pinned Pretext package, not runtime evidence for all six targets. Pretext applies its own line-breaking rules using measured widths. Native fonts, fallback, shaping, and weight selection can differ from browser Canvas; rendering the lines returned by `layoutWithLines()` avoids asking a second engine to choose line breaks. Recheck the upstream context contract and all platform leaves when upgrading Pretext.

Upstream sources: [Pretext README](https://github.com/chenglou/pretext/blob/main/README.md#caveats), [`createContext()` in v1.0.0](https://github.com/chenglou/pretext/blob/v1.0.0/src/measurement.ts).
