# Table

Current exports: `Table`.

**Design: Make Table generic and constrain column keys to the row model.**

rows and renderCell use Record<string, any>, so a column typo or nonexistent field passes checking. Table<T> with keyof T columns and getKey makes common agent-generated tables verifiable. Keep Table for tabular display; use DataGrid only if editable cells, keyboard navigation, or grid selection are actually supported.

Proposed shape (illustrative):

```ts
type ProposedTableColumn<T> = {
	key: keyof T
	label: string
	align?: 'start' | 'center' | 'end'
}
```

Evidence: [src/props.ts:3811](../../../../packages/ui/src/props.ts#L3811), [src/props.ts:3822](../../../../packages/ui/src/props.ts#L3822).

[Audit index](../../README.md)
