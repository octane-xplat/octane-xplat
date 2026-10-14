# Grid

Current exports: `Grid`.

**Design: Publish the portable grid grammar and use column rather than col.**

rows and columns accept unrestricted strings, while child placement uses col/colSpan. Agents will otherwise assume the full CSS Grid grammar and CSS line numbering. Use a bounded track type, state the numbering base, and apply one naming scheme to the grid and its children.

Proposed shape (illustrative):

```ts
type ProposedGridTracks = readonly (number | 'auto' | `${number}fr`)[]
type ProposedGridPlacement = {
	row?: number
	column?: number
	rowSpan?: number
	columnSpan?: number
}
```

Evidence: [src/props.ts:106](../../../../packages/ui/src/props.ts#L106), [src/props.ts:36](../../../../packages/ui/src/props.ts#L36).

[Audit index](../../README.md)
