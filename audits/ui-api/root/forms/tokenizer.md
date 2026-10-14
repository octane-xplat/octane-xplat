# Token and Tokenizer

Current exports: `Token`, `Tokenizer`.

**Design: Preserve reference-backed Token and Tokenizer naming and clarify selected-value editing.**

Tokenizer also describes lexical parsing, and this root API exports code tokenization helpers. The earlier Tag/TagInput rename is superseded by the approved naming precedence; coherent entrypoint ownership can distinguish these concepts. Align its value callback with other inputs, use onPress rather than Token.onClick, and give change details a named object instead of another positional convention.

Proposed shape (illustrative):

```ts
type ProposedTokenChange<T> = {
	values: readonly T[]
	change: { type: 'add' | 'remove'; item: T }
}
```

Evidence: [src/props.ts:3460](../../../../packages/ui/src/props.ts#L3460), [src/props.ts:3516](../../../../packages/ui/src/props.ts#L3516).

[Audit index](../../README.md)
