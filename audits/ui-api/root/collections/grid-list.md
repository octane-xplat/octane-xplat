# GridList and useGridList

Current exports: `GridList`, `useGridList`.

**Design: Keep keyed selection and make item and selection types reusable.**

GridList already has selectedKeys/defaultSelectedKeys/onSelectionChange and separates onAction from selection. Reuse exported Key/Selection instead of spelling unions again, and share getKey with collection stores instead of keyExtractor. Constrain single selection and clarify when children and renderItem may both supply content.

Proposed shape (illustrative):

```ts
type ProposedKey = string | number
type ProposedCollectionProps<T> = {
	items: readonly T[]
	getKey(item: T): ProposedKey
}
```

**Fix: Expose keyboard-navigation support rather than returning a no-op hook.**

The native useGridList returns an empty gridProps bag and ignores its options. Matching type names do not establish keyboard behavior. Provide a supported native implementation or place the DOM selector-based hook on a web entrypoint; keep the visual collection portable.

Proposed shape (illustrative):

```ts
type ProposedGridKeyboardSupport = {
	arrowNavigation: boolean
	rowSelectorSupported: boolean
}
```

Evidence: [src/props.ts:6975](../../../../packages/ui/src/props.ts#L6975), [src/use-grid-list.tsrx:4](../../../../packages/ui/src/use-grid-list.tsrx#L4).

[Audit index](../../README.md)
