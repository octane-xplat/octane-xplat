### Honor spring duration and bounce

Motion springs honor `duration` and `bounce` when you leave `stiffness`, `damping`, and `mass` unset. Duration is the time to complete in seconds. Use the physical inputs when a spring should carry the release velocity from a gesture.

```tsx
<motion.View animate={{ x: 100 }} transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }} />
```

[Motion and gestures](https://octane-xplat.goddardai.org/animation-gestures)
