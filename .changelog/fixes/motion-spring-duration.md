### Honor spring duration and bounce

Motion springs now honor duration and bounce when no physical spring inputs are set. Duration means full completion time in seconds. Any explicit stiffness, damping, or mass takes precedence; use those inputs when a gesture release should preserve velocity. See [animation and gestures](https://octane-xplat.goddardai.org/app/animation-gestures).

```tsx
<motion.View animate={{ x: 100 }} transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }} />
```
