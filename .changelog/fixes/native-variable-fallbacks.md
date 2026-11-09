### Preserve CSS variable fallbacks on native hosts

Native styles now keep complete color and calculation fallbacks. Missing variables reset the affected style instead of leaving an old value or turning a calculation into zero. Variables can refer to another variable declared later in the same rule.

```css
.trip-card {
  --inset: var(--card-space);
  --card-space: 8px;
  padding: var(--inset, 12px);
  color: var(--ink, rgb(17, 34, 51));
}
```

See the [styling guide](https://octane-xplat.goddardai.org/styling).
