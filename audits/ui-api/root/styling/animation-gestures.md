# useAnimation, setTranslate, and gesture events

Current exports: `useAnimation`, `setTranslate`.

**Design: Name the animated value and type the property it drives.**

useAnimation returns one numeric AnimatedValue with a ref and string property name, not a general animation controller. Prefer useAnimatedValue and a supported transform-property union. State milliseconds and gesture coordinate/velocity units, and expose completion/cancellation results when callers sequence animations.

Proposed shape (illustrative):

```ts
type ProposedAnimationOptions = {
	property: 'translateX' | 'translateY' | 'scaleX' | 'scaleY' | 'rotate'
	durationMs?: number
}
```

Evidence: [src/props.ts:11](../../../../packages/ui/src/props.ts#L11), [src/props.ts:2721](../../../../packages/ui/src/props.ts#L2721), [src/anim.web.tsrx:7](../../../../packages/ui/src/anim.web.tsrx#L7).

[Audit index](../../README.md)
