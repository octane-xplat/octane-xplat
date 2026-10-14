# TextInput and TextArea

Current exports: `TextInput`, `TextArea`.

**Design: Give both text controls the same state triple and familiar input options.**

TextInput has value and onChange but no defaultValue; SearchInput does. Prefer onValueChange and add defaultValue. Replace secure with an explicit password type, keep keyboard hints separate from validation, and align hasClear/hasAutoFocus with the common convention. TextArea should preserve the same control and ref contract.

Proposed shape (illustrative):

```ts
type ProposedTextValueProps = {
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	autoFocus?: boolean
}
```

Evidence: [src/props.ts:517](../../../../packages/ui/src/props.ts#L517), [src/props.ts:544](../../../../packages/ui/src/props.ts#L544).

[Audit index](../../README.md)
