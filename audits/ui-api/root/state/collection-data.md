# useListData and useTreeData

Current exports: `useListData`, `useTreeData`.

**Design: Keep the familiar collection operations and make snapshots readonly.**

The stores describe immutable collection data but expose mutable arrays and Set values. An agent can mutate a snapshot and bypass notification. Return readonly items/selection, use one Key/Selection/getKey contract across visual collections, and explain that initialItems/initialSelectedKeys are initialization rather than reactive props. The naming matches [React Aria selection conventions](https://react-aria.adobe.com/selection).

Proposed shape (illustrative):

```ts
type ProposedCollectionSnapshot<T> = {
	readonly items: readonly T[]
	readonly selectedKeys: 'all' | ReadonlySet<string | number>
}
```

Evidence: [src/list-data.ts:12](../../../../packages/ui/src/list-data.ts#L12), [src/tree-data.ts:19](../../../../packages/ui/src/tree-data.ts#L19).

[Audit index](../../README.md)
