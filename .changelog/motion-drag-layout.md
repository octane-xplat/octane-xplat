Dragging now works through layout changes. A dragged host takes over from its current animated position and stays at the pointer while the host or its ancestors move.

```tsx
<motion.View layout drag="x" dragMomentum={false}
  style={{ marginLeft: shifted ? 100 : 0, width: 100, height: 80 }} />
```

Release and cleanup restore ordinary layout animation. See [dragging through layout changes](https://octane-xplat.goddardai.org/animation-gestures#keep-dragging-through-layout-changes).
