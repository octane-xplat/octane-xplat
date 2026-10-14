# AppShell and MobileNav

Current exports: `AppShell`, `AppShellMobileContext`, `MobileNav`, `MobileNavToggle`, `useAppShellMobile`.

**Design: Separate MobileNav configuration from a rendered slot.**

mobileNav?: false | MobileNavConfig | any collapses to any, making invalid configuration indistinguishable from content. Use separate mobileNav and mobileNavOptions props or a typed discriminator. Align isOpen with the common open triple and keep raw AppShellMobileContext private unless custom providers are intentionally supported.

Proposed shape (illustrative):

```ts
type ProposedMobileNavigation<TContent> = {
	mobileNav?: TContent
	mobileNavOptions?: { breakpoint: number; side: 'start' | 'end' }
}
```

Evidence: [src/props.ts:4852](../../../../packages/ui/src/props.ts#L4852), [src/props.ts:5193](../../../../packages/ui/src/props.ts#L5193).

[Audit index](../../README.md)
