Layout animations now keep numeric rounded corners and shadows steady during resizing. Authored styles are restored when projection ends.

```tsx
<motion.View layout style={{ borderRadius: 20, width: expanded ? 300 : 150 }} />
```

Native corners and scalar blur are exact under uniform scale and approximate otherwise. Multiple web shadows remain uncorrected. See [layout animations](https://octane-xplat.dev/app/animation-gestures#layout-animations).
