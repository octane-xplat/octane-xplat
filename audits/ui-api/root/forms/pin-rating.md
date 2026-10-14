# PinInput and InputRating

Current exports: `PinInput`, `InputRating`.

**Design: Use consistent input names and complete value contracts.**

Withdraw the generic RatingInput rename until the higher-priority references are checked; lexical symmetry alone does not override their naming. PinInput has no defaultValue, while rating does. Keep PIN values as strings so leading zeros survive, and state allowed characters and paste behavior. Define whether rating permits zero, fractional steps, and clearing instead of leaving these to generated guesses.

Proposed shape (illustrative):

```ts
type ProposedPinValue = {
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	onComplete?: (value: string) => void
}
```

Evidence: [src/props.ts:3199](../../../../packages/ui/src/props.ts#L3199), [src/props.ts:3633](../../../../packages/ui/src/props.ts#L3633).

[Audit index](../../README.md)
