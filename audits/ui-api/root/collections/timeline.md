# Timeline

Current exports: `Timeline`.

**Keep: Keep Timeline as display data and require stable item identity.**

The concept is familiar and does not need router or selection ownership. Align item keys, content slots, and time values with the shared collection and timestamp contracts. Stable identity lets agents update a timeline incrementally without falling back to array-position keys.

Proposed shape (illustrative):

```ts
type ProposedTimelineItem = {
	id: string
	title: string
	occurredAtMs?: number
}
```

Evidence: [src/props.ts:3839](../../../../packages/ui/src/props.ts#L3839).

[Audit index](../../README.md)
