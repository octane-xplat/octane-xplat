### Animate sizes and clipping with Motion

Motion now accepts registered size, spacing, border, shadow and clipping targets on web, iOS and Android. Lengths can use logical units or measured relative units; compatible shapes and paths can animate through the existing interruption machinery. Native crops stay in Mason's style ownership through layout and background redraw.

```tsx
<motion.View
  style={{ width: 240, height: 160 }}
  initial={{ clipPath: 'inset(20% round 16px)' }}
  animate={{ clipPath: 'inset(0% round 0px)' }}
/>
```

**Breaking change:** `useTransform` results are read-only. Update their source value instead of calling `set`, `jump` or `animate` on the derived handle. Expanded targets use JavaScript playback and are unsupported on experimental desktop hosts. See [sizes, units and clipping](https://octane-xplat.goddardai.org/animation-values) for matching paths, reference boxes and video-transition examples.

```tsx
const progress$ = useMotionValue(0)
const opacity$ = useTransform(progress$, [0, 1], [0.2, 1])
// Drive the source; opacity$ is read-only.
progress$.set(1)
```
