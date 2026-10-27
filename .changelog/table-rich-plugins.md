### Group, expand, and number table rows

Table plugins now support collapsible groups, nested trees, row detail panels,
row numbers and labelled status markers. Sticky columns pin to the start or
end of a horizontally scrolling web table; native pinning remains unsupported.

```tsx
function ExampleTable() {
  const state = useTableTreeState({ data, idKey: 'id' })
  const tree = useTableTreeData({ ...state.treeConfig, hasExpandAllControl: true })
  return <Table data={state.visibleData} columns={columns} idKey="id" plugins={{ tree }} />
}
```

[Group and expand table rows](https://octane-xplat.goddardai.org/tables)
