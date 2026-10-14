# Badge and Chip

Current exports: `Badge`, `Chip`.

**Design: Keep Badge passive and make Chip interaction explicit.**

Badge is a simple content marker; Chip adds selection and removal through selected/onSelect. Give selectable chips selected/onSelectedChange and ordinary activation onPress, leaving removal separate. Share appearance vocabulary with Token/Tag instead of multiplying nearly identical shapes with unrelated event names.

Proposed shape (illustrative):

```ts
type ProposedChipEvents = {
	selected?: boolean
	onSelectedChange?: (selected: boolean) => void
	onPress?: () => void
	onRemove?: () => void
}
```

Evidence: [src/props.ts:3039](../../../../packages/ui/src/props.ts#L3039), [src/props.ts:3921](../../../../packages/ui/src/props.ts#L3921).

[Audit index](../../README.md)
