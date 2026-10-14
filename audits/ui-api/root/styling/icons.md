# Icon and icon registration

Current exports: `Icon`, `registerIcon`, `registerIcons`.

**Design: Type registered icon names and separate decorative from meaningful icons.**

Icon.name is any string and lacks a shared accessible-name prop. Use an augmentable name map or a typed registry, and require a label when the icon conveys information. Keep registration app-scoped or explicitly boot-only; an agent should not guess whether a late registration updates mounted icons.

Proposed shape (illustrative):

```ts
type ProposedIconProps<Name extends string> =
	| { name: Name; decorative: true; label?: never }
	| { name: Name; decorative?: false; label: string }
```

Evidence: [src/props.ts:1434](../../../../packages/ui/src/props.ts#L1434), [src/icons.ts:1](../../../../packages/ui/src/icons.ts#L1).

[Audit index](../../README.md)
