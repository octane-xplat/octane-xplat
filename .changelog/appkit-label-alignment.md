### Align native macOS label text with logical edges

AppKit labels now resolve start/end alignment from CSS direction, with a
left-to-right fallback. Left/right/center/justify remain explicit. Changing or
removing either style refreshes attributed paragraphs; unsupported values warn
and use the default edge. This adds an alignment source path, with native
measurement, justification, painting and installed-app qualification pending.
It does not add CSS bidi overrides or vertical writing.

```css
.amount { text-align: end; }
.rtl-copy { direction: rtl; }
```

See [AppKit text alignment](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/styling.md#appkit-text-alignment).
