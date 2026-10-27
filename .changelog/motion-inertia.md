### Inertia transitions for motion values

`MotionValue.animate` now accepts `type: 'inertia'` — motion-dom's
velocity-driven release with optional `min`/`max` bounds, matching upstream
drag-release semantics. The `target` argument is ignored; pass the current
value.

```ts
x.animate(x.get(), {
	type: 'inertia',
	velocity: vx,
	min: -100,
	max: 100,
	power: 0.5,
	timeConstant: 280,
	bounceStiffness: 360,
	bounceDamping: 36,
})
```

[Motion documentation](https://octane-xplat.goddardai.org/animation-gestures)
