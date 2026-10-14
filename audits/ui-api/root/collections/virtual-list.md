# VirtualList

Current exports: `VirtualList`.

**Design: Share collection naming and publish a useful typed scrolling contract.**

VirtualList has keyExtractor while stores use getKey and Table uses keyFor. Use getKey everywhere. Its handle only exposes scrollToOffset, so common generated tasks such as revealing a selected item need host knowledge. Add scrollToKey/scrollToIndex with explicit alignment and failure behavior, plus the common testID prop.

Proposed shape (illustrative):

```ts
type ProposedVirtualListHandle = {
	scrollToIndex(
		index: number,
		options?: { align?: 'start' | 'center' | 'end'; animated?: boolean },
	): void
}
```

Evidence: [src/props.ts:1116](../../../../packages/ui/src/props.ts#L1116), [src/props.ts:1127](../../../../packages/ui/src/props.ts#L1127).

[Audit index](../../README.md)
