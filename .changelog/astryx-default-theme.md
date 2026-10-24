---
release: lockstep
---

### The default theme is now Astryx's palette and control geometry

`chrome.css` adopts Astryx's default light/dark palette — blue primary
(`#0064E0` light / `#2694FE` dark) replacing the black scheme — plus its
`-apple-system` font stack, and `tokens.css` gives Button real geometry:
28/32/36px heights, 8px/12px padding, 8px radius, 14px/500/20px labels that
truncate with an ellipsis instead of overflowing.

```css
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
// Buttons now render 32px tall, blue primary, label weight 500.
```

**Breaking change:** every component's default colors and Button's default
size, typography, and label truncation change in both light and dark modes.
Apps that want the old look must pin the previous token values in their own
stylesheet.

[Styling tokens](https://octane-xplat.dev/app/styling/)
