# Chat messages and message parts

Current exports: `ChatMessage`, `ChatMessageBubble`, `ChatMessageMetadata`, `ChatSystemMessage`, `ChatTokenizedText`.

**Design: Separate sender identity, visual placement, and delivery status.**

ChatMessage uses sender while the bubble has an independent variant and first/middle/last grouping. Keep those axes explicit and use one typed message ID/data contract. Make metadata and status reusable slots; avoid encoding an AI backend role into presentation when the same components may render human or system messages.

Proposed shape (illustrative):

```ts
type ProposedMessagePresentation = {
	id: string
	placement: 'incoming' | 'outgoing' | 'system'
	groupPosition?: 'single' | 'first' | 'middle' | 'last'
}
```

Evidence: [src/props.ts:4019](../../../../packages/ui/src/props.ts#L4019), [src/props.ts:4045](../../../../packages/ui/src/props.ts#L4045), [src/props.ts:4078](../../../../packages/ui/src/props.ts#L4078), [src/props.ts:4419](../../../../packages/ui/src/props.ts#L4419).

[Audit index](../../README.md)
