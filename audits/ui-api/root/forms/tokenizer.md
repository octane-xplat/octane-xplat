# Token and Tokenizer

Current exports: `Token`, `Tokenizer`.

**Design: Use Tag and TagInput for selected-value editing.**

Tokenizer also describes lexical parsing, and this root API exports code tokenization helpers. TagInput is a clearer frontend name for a multi-value editor. Align its value callback with other inputs, use onPress rather than Token.onClick, and give change details a named object instead of another positional convention.

Proposed shape (illustrative):

```ts
type ProposedTagChange<T> = {
	values: readonly T[]
	change: { type: 'add' | 'remove'; item: T }
}
```

Evidence: [src/props.ts:3460](../../../../packages/ui/src/props.ts#L3460), [src/props.ts:3516](../../../../packages/ui/src/props.ts#L3516).

[Audit index](../../README.md)
