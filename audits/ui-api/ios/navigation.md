# UITabBar and SideDrawer

Current exports: `UITabBar`, `SideDrawer`.

**Design: Keep OS names but match the shared navigation state model.**

The subpath aliases PlatformTabSpec to TabSpec yet also exports shared TabsProps, making type selection easy to get wrong. Export UITabBarProps/UITabBarItem and SideDrawerProps directly, use stable selected keys and open/onOpenChange, and keep native stack hosting as an explicit option rather than a required mental model.

Proposed shape (illustrative):

```ts
type ProposedUITabBarItem = {
	key: string
	title: string
	systemIcon?: string
}
```

Evidence: [src/ios/index.ts:11](../../../packages/ui/src/ios/index.ts#L11), [src/props.ts:2337](../../../packages/ui/src/props.ts#L2337).

[Audit index](../README.md)
