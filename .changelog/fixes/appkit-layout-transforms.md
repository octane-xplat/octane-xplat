---
hype: 50
---

### Keep macOS transforms and shadows aligned during layout

On the experimental AppKit host, transforms now survive initial layout and later frame updates. Percentage translations follow changes to the element's size, including animated translations. Pending frame repaints stop when the view is replaced or removed.

```tsx
<masonview style={{ width: 120, height: 80, translateX: '25%' }} />
```

Shadows now follow moving and resizing views during layout animations and return to their authored blur afterward. Previously, a shadow could stay at its original scale with an enlarged blur.

See [macOS renderer setup](https://octane-xplat.goddardai.org/package-macos-appkit) and [layout animations](https://octane-xplat.goddardai.org/animation-gestures#layout-animations).
