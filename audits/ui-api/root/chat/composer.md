# ChatComposer and composer controls

Current exports: `ChatComposer`, `ChatComposerInput`, `ChatComposerDrawer`, `ChatSendButton`, `useChatComposerContext`.

**Design: Separate the draft state from send/stop lifecycle.**

Composer and input use onChange while ChatSendButton offers onSend, onStop, and onPress, plus isStopShown. Prefer value/onValueChange, onSubmit, and an explicit idle/sending state with onCancel. Define whether successful submit clears the draft, what errors retain, and whether a supplied input slot must use composer context.

Proposed shape (illustrative):

```ts
type ProposedComposerActions = {
	status: 'idle' | 'sending'
	onSubmit(value: string): void | Promise<void>
	onCancel?: () => void
	onError?: (error: unknown) => void
}
```

Evidence: [src/props.ts:4303](../../../../packages/ui/src/props.ts#L4303), [src/props.ts:4367](../../../../packages/ui/src/props.ts#L4367), [src/props.ts:4388](../../../../packages/ui/src/props.ts#L4388).

[Audit index](../../README.md)
