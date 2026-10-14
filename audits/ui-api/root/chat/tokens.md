# Composer tokens, triggers, and paste hooks

Current exports: `ChatComposerTokenElement`, `useChatPasteAsToken`, `useChatComposerTokens`.

**Design: Make structured composer content round-trip through one public value model.**

The composer value is string while insertToken returns an optional string ID and tokens have separate portal/serialization machinery. Define a serializable text-and-token document, stable IDs, and explicit encode/decode helpers. Reuse the shared search source for triggers and return named paste outcomes instead of an unexplained boolean.

Proposed shape (illustrative):

```ts
type ProposedComposerContent = readonly (
	{ type: 'text'; text: string } | { type: 'token'; id: string; label: string; data: unknown }
)[]
```

Evidence: [src/props.ts:4213](../../../../packages/ui/src/props.ts#L4213), [src/props.ts:4243](../../../../packages/ui/src/props.ts#L4243), [src/props.ts:4268](../../../../packages/ui/src/props.ts#L4268), [src/props.ts:4524](../../../../packages/ui/src/props.ts#L4524).

[Audit index](../../README.md)
