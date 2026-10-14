# Popover and useLayer

Current exports: `Popover`, `useLayer`.

**Design: Use one anchored positioning contract and a standard open state.**

Popover combines placement/alignment with layerPosition and an any-based anchor ref; useLayer calls anchor-relative mode context and returns show/hide/isOpen. Prefer mode="anchored" versus "fixed", open/close, and a typed anchor contract. Keep the primitive for custom surfaces, but hide duplicated placement plumbing.

Proposed shape (illustrative):

```ts
type ProposedLayerPosition =
	| {
			mode: 'anchored'
			placement: 'top' | 'right' | 'bottom' | 'left'
			alignment?: 'start' | 'center' | 'end'
	  }
	| { mode: 'fixed'; x: number; y: number }
```

Evidence: [src/props.ts:1500](../../../../packages/ui/src/props.ts#L1500), [src/props.ts:1553](../../../../packages/ui/src/props.ts#L1553), [src/props.ts:1609](../../../../packages/ui/src/props.ts#L1609).

[Audit index](../../README.md)
