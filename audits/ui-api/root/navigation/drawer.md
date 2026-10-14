# Drawer

Current exports: `Drawer`.

**Design: Use one open-state contract and explicit content slots.**

Drawer uses main/drawer and onDismiss, unlike MobileNav.isOpen/onOpenChange and Dialog. Prefer children for main content, drawerContent for the panel, and open/defaultOpen/onOpenChange. State whether it is a modal overlay or persistent layout so agents know who owns focus, back handling, and screen width.

Proposed shape (illustrative):

```ts
type ProposedDrawerState = {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	mode?: 'overlay' | 'persistent'
}
```

Evidence: [src/props.ts:1368](../../../../packages/ui/src/props.ts#L1368).

[Audit index](../../README.md)
