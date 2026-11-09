### Stop animation playback from lifecycle callbacks

Motion values now honor stop, destruction and replacement from animation listeners. Cancelled runs release scheduled frames, including infinite repeats, and cannot complete or overwrite a replacement. See [value lifecycle](https://octane-xplat.goddardai.org/app/animation-gestures#bind-values-and-gestures).

```tsx
const unsubscribe = x.on('animationStart', () => x.stop())
const job = x.animate(80, { duration: 0.2 })
void job.finished.then((result) => console.log(result)) // cancelled
unsubscribe()
```
