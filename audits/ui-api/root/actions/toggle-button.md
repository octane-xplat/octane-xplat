# ToggleButton and ToggleButtonGroup

Current exports: `ToggleButton`, `ToggleButtonGroup`.

**Design: Use pressed/onPressedChange for a button and selectionMode for its group.**

The group already uses a discriminated single/multiple union; preserve that protection. Replace the generic type prop and its onChange callback with the selection vocabulary used by GridList. Remove pressedChangeAction as a second mutation path or fold its async behavior into one documented callback.

Proposed shape (illustrative):

```ts
type ProposedToggleGroup =
	| { selectionMode: 'single'; value: string | null; onValueChange(value: string | null): void }
	| {
			selectionMode: 'multiple'
			value: readonly string[]
			onValueChange(value: readonly string[]): void
	  }
```

Evidence: [src/props.ts:5514](../../../../packages/ui/src/props.ts#L5514), [src/props.ts:5544](../../../../packages/ui/src/props.ts#L5544).

[Audit index](../../README.md)
