Shared layout transitions now account for scrolling that happens before the source is removed. Fixed-position web containers ignore scrolling outside their fixed tree.

```tsx
<ScrollableArea style={{ height: 200 }}>
  <motion.View layoutId="card" style={{ width: 150, height: 100 }} />
</ScrollableArea>
```

Scroll offsets are detected automatically. See [layout animations](https://octane-xplat.goddardai.org/animation-gestures#layout-animations).
