# ProgressBar, Meter, Spinner, ProgressGroup, and StatusDot

Current exports: `ProgressBar`, `Meter`, `Spinner`, `ProgressGroup`, `StatusDot`.

**Fix: Rename the current Meter to ProgressRing, or implement actual meter semantics.**

The web Meter renders role="progressbar". A meter measures a scalar within a range; task completion is a different concept. ProgressRing describes the current circular progress display without teaching agents the wrong semantic role. The distinction comes from the [WAI-ARIA meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/).

Proposed shape (illustrative):

```ts
type ProposedProgressRingProps = {
	value: number
	max?: number
	label: string
}
```

**Design: Use one numeric range contract and reserve status for nonnumeric state.**

ProgressBar permits both value and isIndeterminate, Spinner has busy, and ProgressGroup contains another progress value shape. Prefer a determinate/indeterminate union and a consistent accessible label. Keep StatusDot independent; success/error is not a percentage.

Proposed shape (illustrative):

```ts
type ProposedProgressState =
	{ indeterminate: true; value?: never } | { indeterminate?: false; value: number; max?: number }
```

Evidence: [src/props.ts:1406](../../../../packages/ui/src/props.ts#L1406), [src/props.ts:6333](../../../../packages/ui/src/props.ts#L6333), [src/Meter.web.tsrx:23](../../../../packages/ui/src/Meter.web.tsrx#L23).

[Audit index](../../README.md)
