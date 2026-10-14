# Markdown, MarkdownScreen, and parsing

Current exports: `Markdown`, `MarkdownScreen`, `parseMdDoc`, `parseMdNodes`, `mdInlineText`.

**Design: Use descriptive document names and exactly one source.**

Markdown accepts both data and text, and its AST uses MdDoc, t, and v. Prefer MarkdownDocument, kind, and version in a public serialized format; abbreviations save little and make generated data harder to inspect. Discriminate source props so stale parsed data cannot compete with new text. Keep MarkdownScreen only as a documented composition.

Proposed shape (illustrative):

```ts
type ProposedMarkdownSource<TDocument> =
	{ text: string; document?: never } | { text?: never; document: TDocument }
```

Evidence: [src/props.ts:6678](../../../../packages/ui/src/props.ts#L6678), [src/props.ts:6705](../../../../packages/ui/src/props.ts#L6705).

[Audit index](../../README.md)
