# Outline and outline discovery

Current exports: `Outline`, `useOutlineFromMarkdown`, `useOutlineFromDoc`, `useOutlineFromDOM`, `parseOutlineFromMarkdown`, `outlineFromDoc`, `markdownHeadings`, `inlineMarkdownText`, `slugify`, `uniqueSlug`.

**Fix: Keep DOM discovery web-specific and make the shared data path primary.**

Native useOutlineFromDOM walks header views and ignores its options; its name and option type promise a DOM operation. UseOutlineFromView can describe that distinct operation. Keep Outline.items and document-derived headings portable, and move general slug/markdown parsing helpers to their owning feature rather than the UI root.

Proposed shape (illustrative):

```ts
type ProposedOutlineSources = {
	shared: ['useOutlineFromMarkdown', 'useOutlineFromDoc']
	web: ['useOutlineFromDOM']
	native: ['useOutlineFromView']
}
```

Evidence: [src/props.ts:6637](../../../../packages/ui/src/props.ts#L6637), [src/outline-dom.tsrx:9](../../../../packages/ui/src/outline-dom.tsrx#L9).

[Audit index](../../README.md)
