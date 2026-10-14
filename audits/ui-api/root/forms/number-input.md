# NumberInput

Current exports: `NumberInput`.

**Design: Represent an empty numeric field explicitly.**

value/defaultValue/onValueChange use number only. Empty editing and invalid intermediate text are unavoidable, so a generated form otherwise guesses zero or NaN. Use number | null for committed values, define step and bound behavior, and expose parse/validation errors separately from temporary input text.

Proposed shape (illustrative):

```ts
type ProposedNumberValue = {
	value?: number | null
	defaultValue?: number | null
	onValueChange?: (value: number | null) => void
}
```

Evidence: [src/props.ts:3181](../../../../packages/ui/src/props.ts#L3181).

[Audit index](../../README.md)
