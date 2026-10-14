# Center, Section, and AspectRatio

Current exports: `Center`, `Section`, `AspectRatio`.

**Design: Keep the convenience names, but give each one a single layout responsibility.**

AspectRatio combines a required ratio with shape and fit, which can overlap geometry and content sizing. Section combines layout with decorative dividers. State precedence or separate these concerns; reuse the same spacing and size types as Stack. These helpers should remove decisions, not introduce another layout vocabulary.

Proposed shape (illustrative):

```ts
type ProposedAspectRatioProps = {
	ratio: number
	fit?: 'contain' | 'cover'
}
const square: ProposedAspectRatioProps = { ratio: 1, fit: 'contain' }
```

Evidence: [src/props.ts:6731](../../../../packages/ui/src/props.ts#L6731), [src/props.ts:6750](../../../../packages/ui/src/props.ts#L6750), [src/props.ts:6815](../../../../packages/ui/src/props.ts#L6815).

[Audit index](../../README.md)
