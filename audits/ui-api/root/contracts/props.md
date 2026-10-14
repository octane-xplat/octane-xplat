# Shared props and type safety

**Design: Use one typed base contract for styling, accessibility, refs, and test IDs.**

Common props are repeated with different coverage. List has data-testid while many components have testID; VirtualList has neither in its declared props. Keep testID as the portable spelling, and use renderer-owned child/ref/class types plus a typed portable style subset. Avoid blanket any: mobileNav?: false | MobileNavConfig | any currently loses all useful checking.

Proposed shape (illustrative):

```ts
type ProposedCommonProps = {
	id?: string
	testID?: string
	className?: string | readonly (string | false | null | undefined)[]
}
```

**Design: Keep platform escape hatches explicit and outside the portable contract.**

ios, android, and web bags are useful, but their any or Record<string, any> types also accept misspellings and can override shared behavior. Use target-owned types and explain precedence. Reject unsupported shared values rather than accepting arbitrary CSS strings as a promise of portability.

Proposed shape (illustrative):

```ts
type ProposedEscapeHatches<IOSProps, AndroidProps, WebProps> = {
	ios?: Partial<IOSProps>
	android?: Partial<AndroidProps>
	web?: Partial<WebProps>
}
```

Evidence: [src/props.ts:318](../../../../packages/ui/src/props.ts#L318), [src/props.ts:4852](../../../../packages/ui/src/props.ts#L4852), [src/props.ts:6909](../../../../packages/ui/src/props.ts#L6909).

[Audit index](../../README.md)
