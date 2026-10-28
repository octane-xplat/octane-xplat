### Label padding, letter-spacing, italic, and visibility on macOS

AppKit labels now honor `padding`, `letter-spacing`, and italic `font-style`,
and every element honors `visibility: hidden` (keeps its slot) and
`visibility: collapse` (leaves the layout).

```css
.caption { padding: 2px 6px; letter-spacing: 0.5px; font-style: italic; }
.ghost { visibility: hidden; }
```

[AppKit styling](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets)
