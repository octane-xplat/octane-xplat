# ComplexSelector

Current exports: `ComplexSelector`.

**Design: Preserve reference-backed ComplexSelector naming and use a named render-state object.**

Resolve the name through D6; a generic Picker preference does not override an Astryx equivalent. Its four positional children arguments are easy to reorder, and contentXstyle is inconsistent with contentStyle elsewhere. Use one render-state object and consistent content-style and open/value contracts; make asynchronous commit behavior explicit.

Proposed shape (illustrative):

```ts
type ProposedSelectorRenderState<T> = {
	value: T
	setValue(value: T): void
	close(): void
	pending: boolean
}
```

Evidence: [src/props.ts:3594](../../../../packages/ui/src/props.ts#L3594).

[Audit index](../../README.md)
