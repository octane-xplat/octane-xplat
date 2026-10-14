# RichText and RichTextSpan

Current exports: `RichText`, `RichTextSpan`.

**Design: Clarify that RichText is formatted display text, not an editor.**

RichTextSpan accepts both text and children without a type-level choice. Require one content source and describe which nesting is portable. Keep editing in a clearly named editor API, and align span activation with Pressable semantics rather than letting agents infer contenteditable behavior from RichText.

Proposed shape (illustrative):

```ts
type ProposedSpanContent = { text: string; children?: never } | { text?: never; children: string }
```

Evidence: [src/props.ts:401](../../../../packages/ui/src/props.ts#L401), [src/props.ts:416](../../../../packages/ui/src/props.ts#L416).

[Audit index](../../README.md)
