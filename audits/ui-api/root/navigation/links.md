# Link and NavLink

Current exports: `Link`, `NavLink`.

**Design: Give links a shared contract and accept typed route destinations.**

Link takes href while NavLink takes a full mutable Route object containing stack and loader state. Prefer a destination type separate from runtime route state, add consistent disabled/accessibility/test props, and state internal-versus-external URL handling. Preserve real browser link behavior and expose selected state independently of styling.

Proposed shape (illustrative):

```ts
type ProposedDestination =
	{ href: string } | { route: string; params?: Readonly<Record<string, string | number>> }
```

Evidence: [src/props.ts:2411](../../../../packages/ui/src/props.ts#L2411), [src/props.ts:2419](../../../../packages/ui/src/props.ts#L2419).

[Audit index](../../README.md)
