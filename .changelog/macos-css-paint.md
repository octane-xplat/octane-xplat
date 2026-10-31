### macOS/AppKit CSS paint coverage

AppKit now paints layered CSS backgrounds, non-solid outlines, full
`box-shadow` lists, and per-window `@media` results.

- `background`/`background-image` plus `background-repeat`, `-position`,
  `-size`, `-origin` and `-clip` paint comma-separated `url()` image and
  `linear`/`radial`/`conic` gradient layers (including `repeating-`
  variants) under the border, in CSS order. The `background` shorthand
  resets unmentioned longhands.
- `outline`/`outline-*` paints `dashed`, `dotted`, `double`, `groove`,
  `ridge`, `inset` and `outset` instead of falling back to a solid ring.
- `box-shadow` paints every list entry: multiple outset shadows render on
  sibling layers so corner clipping stays on, and `inset` shadows carry
  real blur, offset and spread.
- `@media` width/height resolves per window — portal content uses its own
  window's size, and resizing restyles only the affected windows'
  containers instead of every root.

```css
.card { background-image: linear-gradient(rgba(0,0,0,0.3), transparent), url(~/card.png); }
.field:focus-visible { outline: 3px dashed #1677ff; }
.hero { box-shadow: 0 8px 24px rgba(0,0,0,0.4), inset 0 2px 6px rgba(0,0,0,0.3); }
```

Known limits: `background-attachment`, `background-blend-mode` and
`background-clip: text` warn and stay unsupported, matching the GTK target.
