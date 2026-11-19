### Stop animation playback from lifecycle callbacks

Stopping or replacing an animation from a Motion listener now ends the old run, including infinite repeats. Pending frames from that run can no longer overwrite its replacement.

```tsx
const unsubscribe = x.on('animationStart', () => x.stop())
const job = x.animate(80, { duration: 0.2 })
void job.finished.then((result) => console.log(result)) // cancelled
unsubscribe()
```

[Motion value lifecycle](https://octane-xplat.goddardai.org/animation-gestures#bind-values-and-gestures)
