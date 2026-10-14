# Item, List, and ListItem

Current exports: `Item`, `List`, `ListItem`.

**Design: Choose ListItem as the canonical content row.**

Item has title/supportingText/leading/trailing plus static subcomponents; ListItem has label/description/startContent/endContent. They describe overlapping row anatomy with different names. Prefer one slot vocabulary and use ListItem for list context; rename a standalone general-purpose row to ContentRow if it remains useful.

Proposed shape (illustrative):

```ts
type ProposedRowSlots<TContent> = {
	label: TContent
	description?: TContent
	startContent?: TContent
	endContent?: TContent
}
```

Evidence: [src/props.ts:3152](../../../../packages/ui/src/props.ts#L3152), [src/props.ts:6909](../../../../packages/ui/src/props.ts#L6909), [src/props.ts:6941](../../../../packages/ui/src/props.ts#L6941).

[Audit index](../../README.md)
