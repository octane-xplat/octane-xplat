# RecyclerView

Current exports: `RecyclerView`.

**Design: Export RecyclerViewProps/RecyclerViewHandle and reuse shared collection contracts.**

Generic ListProps at the Android subpath competes with root ListProps and the iOS list alias. Specific type names make the OS host obvious. Keep Android recycling details explicit while aligning item identity, scroll positioning, viewability, and refresh callbacks with VirtualList and UITableView.

Proposed shape (illustrative):

```ts
type ProposedRecyclerViewIdentity<T> = {
	items: readonly T[]
	getKey(item: T): string | number
	getItemType?: (item: T) => string | number
}
```

Evidence: [src/android/index.ts:10](../../../packages/ui/src/android/index.ts#L10), [src/props.ts:957](../../../packages/ui/src/props.ts#L957).

[Audit index](../README.md)
