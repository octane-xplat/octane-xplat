# Card

Current exports: `Card`.

**Design: Keep Card as a passive container and type its appearance variants.**

variant:string accepts typos and gives agents no completion hints. Publish the supported variants or a deliberate augmentation map, and reuse the same props in interactive card variants. Keep header/footer/children as composition slots; avoid silently treating a passive card as a button.

Proposed shape (illustrative):

```ts
type ProposedCardVariant = 'default' | 'outlined' | 'filled'
```

Evidence: [src/props.ts:3900](../../../../packages/ui/src/props.ts#L3900).

[Audit index](../../README.md)
