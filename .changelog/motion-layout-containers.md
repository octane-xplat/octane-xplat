Motion containers can now use `layoutRoot` to move immediately while their children animate relative to them. Use `layoutAnchor` to choose where a child attaches inside a resizing parent.

```tsx
<motion.View layoutRoot>
  <motion.View layout="position" layoutAnchor={{ x: 1, y: 1 }} />
</motion.View>
```

See [layout animations](https://octane-xplat.goddardai.org/animation-gestures#layout-animations).
