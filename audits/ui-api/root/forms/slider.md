# Slider

Current exports: `Slider`.

**Design: Use the same numeric bounds and value model as NumberInput.**

Slider uses minValue/maxValue while NumberInput uses min/max, and its contract lacks step, defaultValue, and an accessible label. Prefer min/max/step with the standard value triple and a value formatter for assistive output. State whether track presses seek and which values are emitted during dragging versus committed at its end.

Proposed shape (illustrative):

```ts
type ProposedSliderProps = {
	value?: number
	defaultValue?: number
	min?: number
	max?: number
	step?: number
	onValueChange?: (value: number) => void
	onValueCommit?: (value: number) => void
	label: string
}
```

Evidence: [src/props.ts:1420](../../../../packages/ui/src/props.ts#L1420).

[Audit index](../../README.md)
