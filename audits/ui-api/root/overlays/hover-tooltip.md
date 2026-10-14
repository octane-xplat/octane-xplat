# HoverCard, useHoverCard, and Tooltip

Current exports: `HoverCard`, `useHoverCard`, `Tooltip`.

**Design: Share trigger, delay, and open-state vocabulary while keeping semantics distinct.**

HoverCard uses children/content, delay/hideDelay, and isDefaultOpen; Tooltip uses trigger/content and openDelay/closeDelay. Prefer trigger, openDelayMs/closeDelayMs, and the common open triple. Keep tooltip text noninteractive and hover-card content richer; expose the touch strategy and ensure essential information has a visible path.

Proposed shape (illustrative):

```ts
type ProposedHoverOptions = {
	openDelayMs?: number
	closeDelayMs?: number
	touchTrigger?: 'press' | 'longPress' | 'none'
}
```

Evidence: [src/props.ts:1646](../../../../packages/ui/src/props.ts#L1646), [src/props.ts:1697](../../../../packages/ui/src/props.ts#L1697), [src/props.ts:1743](../../../../packages/ui/src/props.ts#L1743).

[Audit index](../../README.md)
