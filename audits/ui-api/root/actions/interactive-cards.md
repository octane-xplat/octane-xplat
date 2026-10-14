# ClickableCard and SelectableCard

Current exports: `ClickableCard`, `SelectableCard`.

**Design: Preserve reference-backed card names and make action and selection semantics explicit.**

Choose names through D6 rather than automatically replacing ClickableCard and SelectableCard with generic ActionCard and SelectionCard. SelectableCard instead mixes isSelected with onChange. Use a coherent activation and selection contract; reuse Card appearance props and the common action contract. Keep link and action behavior explicit when both are available.

Proposed shape (illustrative):

```ts
type ProposedSelectionCardProps = {
	selected: boolean
	onSelectedChange(selected: boolean): void
	disabled?: boolean
}
```

Evidence: [src/props.ts:5564](../../../../packages/ui/src/props.ts#L5564), [src/props.ts:5591](../../../../packages/ui/src/props.ts#L5591).

[Audit index](../../README.md)
