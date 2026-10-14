# LiquidGlass and LiquidGlassContainer

Current exports: `LiquidGlass`, `LiquidGlassContainer`.

**Design: Keep this iOS-only effect explicit and use capability plus duration units.**

The OS-specific subpath is clearer than a glass mode on shared containers. State the minimum OS capability and fallback before agents choose the effect. Consolidate GlassConfig with the component props and rename animateChangeDuration to animationDurationMs so the option expresses a unit and action consistently.

Proposed shape (illustrative):

```ts
type ProposedGlassOptions = {
	variant?: 'regular' | 'clear'
	interactive?: boolean
	animationDurationMs?: number
}
```

Evidence: [src/props.ts:94](../../../packages/ui/src/props.ts#L94), [src/props.ts:248](../../../packages/ui/src/props.ts#L248), [src/ios/index.ts:16](../../../packages/ui/src/ios/index.ts#L16).

[Audit index](../README.md)
