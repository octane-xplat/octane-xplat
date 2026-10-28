### Cursor and user-select on macOS

AppKit views now honor `cursor` — the matching cursor shows while the pointer
is inside the element (`cursor: none` hides it) — and `user-select` toggles
text selection on labels and html views.

```css
.link { cursor: pointer; user-select: none; }
```

[AppKit styling](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets)
