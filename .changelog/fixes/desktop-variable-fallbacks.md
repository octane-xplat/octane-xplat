### Preserve CSS variable fallbacks on desktop

Desktop styles now keep complete color and calculation fallbacks. A CSS variable set to `initial` uses its fallback, and a missing variable no longer turns a calculation into an unintended zero size.

```css
.trip-card {
  --inset: initial;
  padding: var(--inset, 8px);
  color: var(--ink, rgb(17, 34, 51));
}
```

See the [desktop CSS engine guide](https://octane-xplat.goddardai.org/package-css-engine).
