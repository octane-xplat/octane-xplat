### Animate layout changes with `layout`

`motion.View`, `motion.Row`, `motion.Pressable` and `motion.create` hosts now
animate automatically when their measured box changes — resizes, moves and
keyed list reorders — on web, iOS and Android.

```tsx
<motion.Pressable layout onPress={toggle} style={{ width: wide ? 260 : 120 }}>
	<Text>Tap to expand</Text>
</motion.Pressable>
```

Nested `layout` children keep their size inside a scaling parent
(`layout="position"` animates position only), `layoutDependency` limits the
animation to changes of one value, and `transition={{ layout: {...} }}` tunes
the 0.45 s default. `layoutId`, `LayoutGroup`, scroll/root/anchor variants and
macOS are not supported yet; border-radius and box-shadow stretch during
scale, and existing CSS transforms still belong on an outer container.

[Animation and gestures](https://octane-xplat.goddardai.org/animation-gestures#layout-animations)
