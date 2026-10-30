### Steady corners and shadows during layout animation

Layout animations now keep numeric rounded corners and shadows steady during resizing. Authored styles are restored when projection ends.

```tsx
<motion.View layout style={{ borderRadius: 20, width: expanded ? 300 : 150 }} />
```

Native corners and scalar blur are exact under uniform scale and approximate otherwise. Multiple web or Mason core shadows remain uncorrected. See [layout animations](https://octane-xplat.goddardai.org/animation-gestures#layout-animations).
