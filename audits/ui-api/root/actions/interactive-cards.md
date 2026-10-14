# ClickableCard and SelectableCard

Current exports: `ClickableCard`, `SelectableCard`.

**Design: Use ActionCard and SelectionCard with explicit action and selection semantics.**

Clickable is mouse-specific while the component uses onPress and href. SelectableCard instead mixes isSelected with onChange. Prefer ActionCard and selected/onSelectedChange; reuse Card appearance props and the common action contract. Keep link and action behavior explicit when both are available.

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
