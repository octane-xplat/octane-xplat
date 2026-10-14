# Absolute

Current exports: `Absolute`.

**Design: Call the container AbsoluteLayout and make placement a complete contract.**

Absolute names an adjective rather than a layout and currently relies on child left/top props. AbsoluteLayout makes the parent role clearer. Specify coordinates, supported edges, and stacking order together so an agent does not guess that CSS inset or zIndex is portable.

Proposed shape (illustrative):

```ts
type ProposedAbsolutePlacement = {
	left?: number
	top?: number
	right?: number
	bottom?: number
	zIndex?: number
}
```

Evidence: [src/props.ts:234](../../../../packages/ui/src/props.ts#L234), [src/props.ts:36](../../../../packages/ui/src/props.ts#L36).

[Audit index](../../README.md)
