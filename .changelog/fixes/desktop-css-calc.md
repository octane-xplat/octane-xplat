### Calculated desktop styles reach the renderer

AppKit and GTK now use resolved `calc()` values from stylesheet rules, including CSS variables and padding shorthands. Previously, the cascade could keep the original expression after evaluating it, so calculated dimensions did not reach the renderer as resolved values.

```css
.summary {
  --unit: 4px;
  width: calc(var(--unit) * 8);
  padding: calc(var(--unit) * 2);
}
```

See [Styling screens](https://octane-xplat.goddardai.org/app/styling).
