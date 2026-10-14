# useMeasure

Current exports: `useMeasure`.

**Design: Keep useMeasure and specify coordinate space and readiness.**

bounds can be null and ref accepts any. A generated agent needs to know whether bounds are parent-relative or viewport-relative and when the first measurement exists. Name the measurement space in the options and type the attachment; do not make every consumer infer it from a platform host.

Proposed shape (illustrative):

```ts
type ProposedMeasureOptions = {
	observe?: boolean
	relativeTo?: 'parent' | 'viewport'
}
```

Evidence: [src/props.ts:1895](../../../../packages/ui/src/props.ts#L1895).

[Audit index](../../README.md)
