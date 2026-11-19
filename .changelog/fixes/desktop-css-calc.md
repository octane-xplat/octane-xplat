### Calculated desktop styles reach the renderer

On native macOS and Linux GTK, styles now use the result of `calc()` in layout, including calculations with CSS variables or shorthand properties such as `padding`.

```css
.summary {
  --unit: 4px;
  width: calc(var(--unit) * 8);
  padding: calc(var(--unit) * 2);
}
```

See [Styling screens](https://octane-xplat.goddardai.org/styling).
