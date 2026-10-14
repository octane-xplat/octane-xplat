# Collapsible and Accordion

Current exports: `Collapsible`, `Accordion`.

**Design: Use expanded state and discriminate accordion selection.**

Accordion allows multiple=false with an array open value, or multiple=true with a scalar. Model single/multiple expansion as a union and use expandedKeys/onExpandedChange. Keep Collapsible for one disclosure and define whether its trigger is owned or supplied; avoid reusing open for both expansion and overlays.

Proposed shape (illustrative):

```ts
type ProposedAccordionProps =
	| { expansionMode: 'single'; expandedKey: string | null }
	| { expansionMode: 'multiple'; expandedKeys: readonly string[] }
```

Evidence: [src/props.ts:2784](../../../../packages/ui/src/props.ts#L2784), [src/props.ts:2810](../../../../packages/ui/src/props.ts#L2810).

[Audit index](../../README.md)
