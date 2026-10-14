# CheckboxInput and Switch

Current exports: `CheckboxInput`, `Switch`.

**Design: Use Checkbox and one checked/defaultChecked/onCheckedChange contract.**

Both controls have optional checked without defaultChecked. Checkbox adds a separate indeterminate flag, so agents must learn whether that affects the callback value. Keep mixed visual state explicit and distinguish it from the submitted boolean; do not silently turn undefined into a different state model on each target.

Proposed shape (illustrative):

```ts
type ProposedCheckedProps = {
	checked?: boolean
	defaultChecked?: boolean
	onCheckedChange?: (checked: boolean) => void
	indeterminate?: boolean
}
```

Evidence: [src/props.ts:1382](../../../../packages/ui/src/props.ts#L1382), [src/props.ts:2826](../../../../packages/ui/src/props.ts#L2826).

[Audit index](../../README.md)
