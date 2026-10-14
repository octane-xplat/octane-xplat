# KeyboardAvoiding and useKeyboardInset

Current exports: `KeyboardAvoiding`, `useKeyboardInset`.

**Design: Name the wrapper KeyboardAvoidingView and expose how its offset is applied.**

KeyboardAvoiding currently accepts no behavior or offset options. The View suffix clarifies that this is a container, while an offset prevents a fixed header or composer from forcing a platform escape hatch. Specify whether useKeyboardInset excludes system insets and which wrapper already consumes it.

Proposed shape (illustrative):

```ts
type ProposedKeyboardAvoidingProps = {
	enabled?: boolean
	keyboardOffset?: number
	behavior?: 'padding' | 'position' | 'height'
}
```

Evidence: [src/props.ts:1358](../../../../packages/ui/src/props.ts#L1358), [src/use-keyboard-inset.tsrx:1](../../../../packages/ui/src/use-keyboard-inset.tsrx#L1).

[Audit index](../../README.md)
