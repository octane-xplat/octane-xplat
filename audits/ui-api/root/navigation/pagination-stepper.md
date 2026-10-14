# Pagination and Stepper

Current exports: `Pagination`, `Stepper`.

**Design: Make indexing explicit and prefer stable step IDs.**

Pagination.page and Stepper.current do not encode their numbering base, while one callback says page and another says index. Specify one-based page numbers and use activeStepId/onStepChange for steps that can reorder. Keep empty/zero-count behavior explicit so agents do not invent an off-by-one workaround.

Proposed shape (illustrative):

```ts
type ProposedStepSelection = {
	activeStepId: string
	onStepChange?: (stepId: string) => void
}
```

Evidence: [src/props.ts:3692](../../../../packages/ui/src/props.ts#L3692), [src/props.ts:3717](../../../../packages/ui/src/props.ts#L3717).

[Audit index](../../README.md)
