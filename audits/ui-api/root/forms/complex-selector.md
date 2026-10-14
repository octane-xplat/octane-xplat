# ComplexSelector

Current exports: `ComplexSelector`.

**Design: Use Picker for a custom value editor and a named render-state object.**

Complex describes implementation effort rather than the user-facing concept. Its four positional children arguments are easy to reorder, and contentXstyle is inconsistent with contentStyle elsewhere. Prefer Picker with one render-state object, contentStyle, and the standard open/value callbacks; make asynchronous commit behavior explicit.

Proposed shape (illustrative):

```ts
type ProposedPickerRenderState<T> = {
	value: T
	setValue(value: T): void
	close(): void
	pending: boolean
}
```

Evidence: [src/props.ts:3594](../../../../packages/ui/src/props.ts#L3594).

[Audit index](../../README.md)
