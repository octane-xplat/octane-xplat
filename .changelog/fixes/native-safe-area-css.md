### Resolve safe-area CSS on Mason core containers

Apps selecting Mason core `1.0.0-beta.1` now resolve safe-area CSS values from
their owning native window, including Bamboo classes. Insets update without
rewriting styles inline.

```css
.chrome { padding-top: env(safe-area-inset-top, 0px); }
```

Native callback dispatch and layout still await device qualification. The
warning now distinguishes that limit from engines that cannot resolve `env()`.
Ordinary NativeScript controls still need inline insets. See
[safe-area styling](https://octane-xplat.dev/app/styling/#safe-area-insets).
