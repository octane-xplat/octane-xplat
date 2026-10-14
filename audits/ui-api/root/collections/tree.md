# TreeList

Current exports: `TreeList`.

**Design: Use TreeView and make expansion and selection controllable by key.**

TreeList offers defaultExpanded and onToggle, but no controlled expanded set. onSelect returns a node and differs from keyed GridList selection. Prefer expandedKeys/onExpandedChange plus the common selection model; distinguish rendered tree items from CollectionTreeNode so an agent does not pass a store wrapper into the visual API.

Proposed shape (illustrative):

```ts
type ProposedTreeState = {
	expandedKeys?: ReadonlySet<string | number>
	onExpandedChange?: (keys: ReadonlySet<string | number>) => void
	selectedKey?: string | number | null
}
```

Evidence: [src/props.ts:3858](../../../../packages/ui/src/props.ts#L3858), [src/props.ts:3867](../../../../packages/ui/src/props.ts#L3867), [src/tree-data.ts:12](../../../../packages/ui/src/tree-data.ts#L12).

[Audit index](../../README.md)
