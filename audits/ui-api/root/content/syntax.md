# Syntax tokenization

Current exports: `tokenize`, `tokenizeAsync`, `tokenizeStreaming`, `flatTokensToLines`, `SYNC_TOKENIZE_THRESHOLD`, `TOKEN_TYPES`, `syntaxTokenVar`, `syntaxTokenVarRef`.

**Design: Give code syntax a canonical Markdown home and explicit tokenization names.**

tokenize at the root is ambiguous beside Tokenizer and chat tokens. The root also exposes a synchronous size threshold and CSS-variable helpers. Keep tuning constants internal, expose the useful tokenizer contract with Markdown initially; add a syntax entrypoint only for a demonstrated independent consumer task, and type token kinds and offset units rather than leaving type:string.

Proposed shape (illustrative):

```ts
type ProposedSyntaxToken = {
	kind: 'keyword' | 'string' | 'number' | 'comment' | 'plain'
	start: number
	end: number
}
```

Evidence: [src/props.ts:6226](../../../../packages/ui/src/props.ts#L6226), [src/index.shared.ts:943](../../../../packages/ui/src/index.shared.ts#L943).

[Audit index](../../README.md)
