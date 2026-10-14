# UITableView

Current exports: `UITableView`.

**Design: Keep the OS-specific name and export UITableViewProps/UITableViewHandle.**

ListProps at this subpath means an OS-backed list, while root ListProps means a content-list container. Specific widget types avoid accidental cross-imports. Reuse getKey, renderItem, viewability payloads, and scroll units with VirtualList where possible; document only genuine UIKit-specific behavior here.

Proposed shape (illustrative):

```ts
type ProposedUITableViewIdentity<T> = {
	items: readonly T[]
	getKey(item: T): string | number
}
```

Evidence: [src/ios/index.ts:10](../../../packages/ui/src/ios/index.ts#L10), [src/props.ts:957](../../../packages/ui/src/props.ts#L957).

[Audit index](../README.md)
