# Markdown streaming helpers

Current exports: `createMarkdownIncrementalState`, `parseMarkdownIncremental`, `trimStreamingArtifacts`, `computeBoundaries`, `computeSegments`, `markdownTextLength`.

**Design: Expose one streaming parser and keep its segmentation helpers private.**

The root exports low-level boundary, segment, trimming, and length functions alongside the renderer. Agents must infer which order makes a coherent streaming update. Prefer a parser object with append/reset and a documented result; put advanced helpers behind a markdown subpath only when they have an independent supported use.

Proposed shape (illustrative):

```ts
type ProposedStreamingParser<TDocument> = {
	append(chunk: string): TDocument
	finish(): TDocument
	reset(): void
}
```

Evidence: [src/index.shared.ts:27](../../../../packages/ui/src/index.shared.ts#L27), [src/markdown-stream.ts:1](../../../../packages/ui/src/markdown-stream.ts#L1).

[Audit index](../../README.md)
