# NavigationMenu

Current exports: `NavigationMenu`.

**Design: Keep NavigationMenu for destinations and DropdownMenu for commands.**

NavigationMenu has its own item shape and horizontal flag. Share the destination contract with Link/NavLink and use orientation consistently. Do not make agents choose between two similarly named menu APIs without a concrete distinction between navigating somewhere and performing an action.

Proposed shape (illustrative):

```ts
type ProposedNavigationMenuItem = {
	id: string
	label: string
	href: string
	children?: readonly ProposedNavigationMenuItem[]
}
```

Evidence: [src/props.ts:3730](../../../../packages/ui/src/props.ts#L3730).

[Audit index](../../README.md)
