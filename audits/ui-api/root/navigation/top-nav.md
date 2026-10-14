# TopNav and its parts

Current exports: `TopNav`, `TopNavHeading`, `TopNavItem`, `TopNavMenu`, `TopNavMegaMenu`, `TopNavMegaMenuItem`, `TopNavMegaMenuFeaturedCard`, `TopNavRenderContext`, `useTopNavRenderMode`.

**Design: Keep the component family and normalize its action and content slots.**

TopNavItem uses onClick while Tab and ListItem use onPress; heading/menu/featured-card parts add separate anatomy conventions. Reuse shared action/link and startContent/endContent contracts. Keep render-mode coordination behind an accessor hook rather than exposing a provider unless agents are expected to construct their own rendering mode.

Proposed shape (illustrative):

```ts
type ProposedNavigationItem = {
	label: string
	href?: string
	onPress?: () => void
	selected?: boolean
	disabled?: boolean
}
```

Evidence: [src/props.ts:4883](../../../../packages/ui/src/props.ts#L4883), [src/props.ts:4928](../../../../packages/ui/src/props.ts#L4928).

[Audit index](../../README.md)
