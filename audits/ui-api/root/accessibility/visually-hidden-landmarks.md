# VisuallyHidden and useLandmark

Current exports: `VisuallyHidden`, `useLandmark`.

**Design: Keep accessible meaning explicit and separate landmark semantics from keyboard cycling.**

VisuallyHidden should consistently retain accessible content while removing visual layout impact. useLandmark adds region semantics, but web region cycling is a separate interaction. Publish that distinction, type the shared roles, and prefer a straightforward Landmark component for ordinary use so agents do not need to spread opaque prop bags.

Proposed shape (illustrative):

```ts
type ProposedLandmarkProps = {
	role: 'main' | 'navigation' | 'search' | 'region'
	label?: string
}
```

Evidence: [src/props.ts:6771](../../../../packages/ui/src/props.ts#L6771), [src/use-landmark.tsrx:1](../../../../packages/ui/src/use-landmark.tsrx#L1).

[Audit index](../../README.md)
