### Card matches Astryx's default padding and corner radius

`Card` now takes the theme's card padding — upstream's
`--astryx-card-padding` (12px in Neutral, 18px in Matcha and Y2K, 16px
elsewhere) with the 1px border inset — and rounds with the container radius
(`--radius-container`, overridable per theme via `--_card-radius`). Previously
cards rendered with no padding on the root and a fixed 8–10px radius; header,
body, and footer slots carried their own 12px padding.

```css
/* A named theme can retune card geometry by redeclaring the override vars: */
'--astryx-card-padding': '18px',
'--_card-radius': '42px',
```

Cards that relied on the old unpadded root may need an explicit
`padding` prop; `padding={n}` still overrides the theme default entirely.
