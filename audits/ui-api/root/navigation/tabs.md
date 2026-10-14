# Tabs, TabList, Tab, and TabMenu

Current exports: `Tabs`, `TabList`, `Tab`, `TabMenu`, `useTabListContext`.

**Design: Unify tab selection around stable keys and distinguish route navigation from panels.**

Tabs uses selectedIndex/onSelectedIndexChanged; TabList uses value/onChange and Tab may carry href. Prefer selectedKey/onSelectionChange and TabPanel composition for content tabs; give route tabs a distinct navigation contract. Array indices are fragile when tabs reorder. The panel distinction follows the [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

Proposed shape (illustrative):

```ts
type ProposedTabsSelection = {
	selectedKey?: string
	defaultSelectedKey?: string
	onSelectionChange?: (key: string) => void
}
```

Evidence: [src/props.ts:2323](../../../../packages/ui/src/props.ts#L2323), [src/props.ts:4724](../../../../packages/ui/src/props.ts#L4724), [src/props.ts:4757](../../../../packages/ui/src/props.ts#L4757).

[Audit index](../../README.md)
