# Pressable

Current exports: `Pressable`.

**Design: Keep Pressable as the interaction primitive and normalize its press event.**

onPress is appropriate across touch, pointer, and keyboard activation. The current callback has no payload, so consumers must invent platform-specific paths for modifiers or cancellation. Provide a small portable event and keep gesture details in separately typed pan/swipe events.

Proposed shape (illustrative):

```ts
type ProposedPressEvent = {
	pointerType: 'mouse' | 'touch' | 'keyboard' | 'pen'
	shiftKey: boolean
	preventDefault(): void
}
```

Evidence: [src/props.ts:428](../../../../packages/ui/src/props.ts#L428).

[Audit index](../../README.md)
