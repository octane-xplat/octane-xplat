# useKeyboard

Current exports: `useKeyboard`.

**Design: Use a normalized key event and make supported input targets explicit.**

useKeyboard currently forwards unknown keydown/keyup events. The name is also easy to confuse with software-keyboard visibility. Keep useKeyboard for key input only, type key/code/modifiers/composition, and state which shared components forward the returned props. Keep inset detection in useKeyboardInset.

Proposed shape (illustrative):

```ts
type ProposedKeyEvent = {
	key: string
	code: string
	isComposing: boolean
	shiftKey: boolean
	preventDefault(): void
}
```

Evidence: [src/use-keyboard.ts:1](../../../../packages/ui/src/use-keyboard.ts#L1).

[Audit index](../../README.md)
