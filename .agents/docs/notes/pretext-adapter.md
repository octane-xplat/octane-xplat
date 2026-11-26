# Pretext adapter

`@chenglou/pretext@1.0.0` looks for `OffscreenCanvas`, then a document canvas, and throws if neither can create a 2D context. Its documented non-browser adapter surface is a global `OffscreenCanvas` whose 2D context accepts `font` and returns a finite `measureText(text).width`. The Xplat package installs that small surface from each native platform leaf and delegates text widths to the platform font engine; web keeps the browser canvas.

This is source and API evidence from the pinned Pretext package, not runtime evidence for all six targets. Pretext applies its own line-breaking rules using measured widths. Native fonts, fallback, shaping, and weight selection can differ from browser Canvas; rendering the lines returned by `layoutWithLines()` avoids asking a second engine to choose line breaks. Recheck the upstream context contract and all platform leaves when upgrading Pretext.

Pretext 1.0 also calls `atob` to unpack its line-breaking tables on first use. The AppKit JavaScriptCore host returned `undefined` from the decoder, and `prepareWithSegments()` failed in `unpackTable()`. The native adapter keeps a working host decoder or installs a JavaScript implementation. Keep that check beside the measurement context setup. The macOS adapter ships JavaScript and uses the host's existing AppKit link and metadata for all its calls.

`BalancedText` loads this adapter on native when mounted. The component measures the available width and chooses better line breaks while retaining the measured line count. On native it uses the first font family from the theme for measurement and rendering. Keep the GTK entries under `.gtk` so the Linux platform boundary selects the Pango implementation. Browser builds use CSS text balancing through the web leaf.

Upstream sources: [Pretext README](https://github.com/chenglou/pretext/blob/main/README.md#caveats), [`createContext()` in v1.0.0](https://github.com/chenglou/pretext/blob/v1.0.0/src/measurement.ts).
