# Toolbar and OverflowList

Current exports: `Toolbar`, `OverflowList`.

**Design: Keep toolbar composition and make overflow rendering a named operation.**

Toolbar already has a clear start/center/end slot model. OverflowList introduces overflowRenderer and observeParent/observeSelf terminology. Prefer renderOverflow with a typed list of hidden items and describe the measurement boundary in plain options. Reuse the same spacing units and visibility count names as the rest of the API.

Proposed shape (illustrative):

```ts
type ProposedOverflowOptions<T> = {
	measure: 'container' | 'content'
	renderOverflow(items: readonly T[]): unknown
	onOverflowChange?: (items: readonly T[]) => void
}
```

Evidence: [src/props.ts:4674](../../../../packages/ui/src/props.ts#L4674), [src/props.ts:5285](../../../../packages/ui/src/props.ts#L5285).

[Audit index](../../README.md)
