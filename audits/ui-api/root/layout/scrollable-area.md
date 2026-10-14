# ScrollableArea and useScrollableArea

Current exports: `ScrollableArea`, `useScrollableArea`.

**Design: Keep the logical axis vocabulary and add a portable scroll handle.**

inline/block/both is coherent with logical padding; keep it consistent with direction handling. The current ref is any, unlike VirtualListHandle, so agents cannot reliably discover how to scroll. Expose offsets, viewport units, and scrollTo on a typed handle, shared with chat and outline integrations.

Proposed shape (illustrative):

```ts
type ProposedScrollHandle = {
	scrollTo(options: { x?: number; y?: number; animated?: boolean }): void
	getOffset(): { x: number; y: number }
}
```

Evidence: [src/props.ts:1016](../../../../packages/ui/src/props.ts#L1016), [src/props.ts:1075](../../../../packages/ui/src/props.ts#L1075).

[Audit index](../../README.md)
