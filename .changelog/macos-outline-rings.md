### Outlines on macOS

AppKit views now paint `outline`/`outline-*` as a solid ring outside the
border edge, tracking the view's frame and corner radius.

```css
.ring { outline: 1.5px solid #0a0a0a; outline-offset: 2px; }
```

[AppKit styling](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets)
