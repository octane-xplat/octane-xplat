# BottomNavigationView and DrawerLayout

Current exports: `BottomNavigationView`, `DrawerLayout`.

**Design: Use widget-specific types with the shared key and open-state vocabulary.**

The barrel exposes TabSpec and shared TabsProps alongside PlatformTabsProps. Prefer BottomNavigationViewProps/BottomNavigationItem and DrawerLayoutProps so an agent cannot import a similarly named but incompatible type. Normalize selectedKey and open/onOpenChange, preserving OS-specific navigation and gesture options explicitly.

Proposed shape (illustrative):

```ts
type ProposedBottomNavigationItem = {
	key: string
	title: string
	drawableIcon?: string
}
```

Evidence: [src/android/index.ts:11](../../../packages/ui/src/android/index.ts#L11), [src/props.ts:2337](../../../packages/ui/src/props.ts#L2337), [src/props.ts:1368](../../../packages/ui/src/props.ts#L1368).

[Audit index](../README.md)
