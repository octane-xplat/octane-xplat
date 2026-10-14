# MetadataList and MetadataListItem

Current exports: `MetadataList`, `MetadataListItem`.

**Design: Keep the metadata pair model and replace vague configuration names.**

MetadataList.label is actually label-layout configuration, and maxNumOfItems differs from maxVisibleItems elsewhere. Prefer labelLayout and maxVisibleItems; keep each item as a label/value composition. These names tell agents whether they are supplying visible text or configuring its arrangement.

Proposed shape (illustrative):

```ts
type ProposedMetadataLayout = {
	labelLayout?: { position: 'above' | 'inline'; width?: number }
	maxVisibleItems?: number
}
```

Evidence: [src/props.ts:6536](../../../../packages/ui/src/props.ts#L6536), [src/props.ts:6546](../../../../packages/ui/src/props.ts#L6546).

[Audit index](../../README.md)
