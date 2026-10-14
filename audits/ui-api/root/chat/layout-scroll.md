# ChatLayout, ChatMessageList, and scroll hooks

Current exports: `ChatLayout`, `ChatLayoutScrollButton`, `ChatMessageList`, `useChatStreamScroll`, `useChatNewMessages`, `useChatLayoutContext`.

**Design: Use a typed scroll controller and name the lock state by its user meaning.**

Chat shares any-based scroll refs and exposes spring tuning directly in useChatStreamScroll. Prefer a common scroll handle, followingLatest/canScrollToLatest, and scrollToLatest(). Define when user scrolling suspends following and when new-message counts reset; keep animation mechanics behind advanced options.

Proposed shape (illustrative):

```ts
type ProposedChatScrollState = {
	followingLatest: boolean
	newMessageCount: number
	scrollToLatest(): void
}
```

Evidence: [src/props.ts:4099](../../../../packages/ui/src/props.ts#L4099), [src/props.ts:4440](../../../../packages/ui/src/props.ts#L4440), [src/props.ts:4480](../../../../packages/ui/src/props.ts#L4480).

[Audit index](../../README.md)
