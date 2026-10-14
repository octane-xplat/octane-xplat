# Alert, Banner, and EmptyState

Current exports: `Alert`, `Banner`, `EmptyState`.

**Design: Use one tone vocabulary and explicit dismissal state.**

Alert exposes tone, Banner exposes onDismiss, and EmptyState has its own display shape. Share info/success/warning/error where tone is meaningful and define whether dismissal is a request to the caller or local state. Keep EmptyState as a passive composition with an action slot rather than embedding fetch/retry ownership.

Proposed shape (illustrative):

```ts
type ProposedFeedbackProps = {
	tone?: 'info' | 'success' | 'warning' | 'error'
	onDismiss?: () => void
}
```

Evidence: [src/props.ts:3882](../../../../packages/ui/src/props.ts#L3882), [src/props.ts:3948](../../../../packages/ui/src/props.ts#L3948), [src/props.ts:3962](../../../../packages/ui/src/props.ts#L3962).

[Audit index](../../README.md)
