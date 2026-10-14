# SideNav and its parts

Current exports: `SideNav`, `SideNavSection`, `SideNavHeading`, `SideNavItem`, `SideNavCollapseButton`, `useSideNavCollapse`, `SideNavRenderContext`, `useSideNavRenderMode`.

**Design: Use one collapsed state contract and a normal typed ref.**

SideNav mixes collapsible boolean/config, isCollapsed/defaultIsCollapsed, imperative handleRef, and resizable configuration. Prefer collapsed/defaultCollapsed/onCollapsedChange, separate sizing options, and a regular ref. Align SideNavItem.onClick with onPress and keep section/heading/item composition intact.

Proposed shape (illustrative):

```ts
type ProposedCollapseProps = {
	collapsed?: boolean
	defaultCollapsed?: boolean
	onCollapsedChange?: (collapsed: boolean) => void
}
```

Evidence: [src/props.ts:5040](../../../../packages/ui/src/props.ts#L5040), [src/props.ts:5067](../../../../packages/ui/src/props.ts#L5067), [src/props.ts:5136](../../../../packages/ui/src/props.ts#L5136).

[Audit index](../../README.md)
