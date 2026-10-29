### Style native macOS hover, press and focus states with CSS

Experimental AppKit stylesheets now match `:hover`, `:active`, `:focus`,
`:focus-visible` and `:focus-within`, and re-check `@media` width rules when a
window resizes. `:focus-visible` matches text fields and keyboard focus, not a
mouse click on a button. Every window shares the largest window's size for
media rules. Real pointer, keyboard and resize behavior has not yet been
checked on a running Mac.

```css
.row:hover { background-color: #eef3ff; }
.action:focus-visible { outline: 2px solid #1677ff; }
@media (max-width: 600px) { .sidebar { display: none; } }
```

See the [AppKit stylesheet limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/README.md#apply-stylesheets).
