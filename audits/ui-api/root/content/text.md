# Text and Heading

Current exports: `Text`, `Heading`.

**Design: Put the shared typography contract on Text and keep heading level semantic.**

Text exports related typography types but its props lack type, size, color, and weight; Timestamp and Timer expose them. Agents should not discover different styling knobs for ordinary text and time labels. Use one typography contract, with Heading.level determining semantics independently of visual size.

Proposed shape (illustrative):

```ts
type ProposedTypography = {
	size?: 'sm' | 'md' | 'lg'
	weight?: 'normal' | 'medium' | 'bold'
	color?: 'primary' | 'secondary' | 'inherit'
}
```

Evidence: [src/props.ts:372](../../../../packages/ui/src/props.ts#L372), [src/props.ts:1462](../../../../packages/ui/src/props.ts#L1462), [src/props.ts:6158](../../../../packages/ui/src/props.ts#L6158).

[Audit index](../../README.md)
