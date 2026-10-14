# Toast, ToastViewport, showToast, and useToast

Current exports: `Toast`, `ToastViewport`, `showToast`, `useToast`.

**Design: Use content, durationMs, and a named toast handle.**

ToastOptions mixes body/renderContent, isAutoHide/autoHideDuration, uniqueID, onHide, and onDismiss on the visual component. Prefer one content source, durationMs with an explicit persistent option, id, and onDismiss(reason). Return a handle with dismiss/update instead of an anonymous dismiss function; state viewport ownership and collision policy.

Proposed shape (illustrative):

```ts
type ProposedToastHandle<TContent> = {
	id: string
	dismiss(): void
	update(content: TContent): void
}
```

Evidence: [src/props.ts:1772](../../../../packages/ui/src/props.ts#L1772), [src/props.ts:1837](../../../../packages/ui/src/props.ts#L1837), [src/props.ts:1852](../../../../packages/ui/src/props.ts#L1852).

[Audit index](../../README.md)
