### Choose native macOS text overflow with CSS

AppKit labels now apply normal/nowrap whitespace and clip/ellipsis overflow
from CSS when explicit label props are absent. Removing styles restores the
remaining cascade and releases the implicit one-line height. Decorated and
letter-spaced labels retain the current paragraph mode. Native measurement,
painting and installed-app qualification remain pending; CSS preservation,
balanced wrapping and line-clamp remain outside the supported subset.

```css
.compact-title { width: 180px; white-space: nowrap; text-overflow: ellipsis; }
```

See [AppKit text wrapping](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/styling.md#appkit-text-wrapping).
