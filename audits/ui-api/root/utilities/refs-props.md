# Ref helpers and mergeProps

Current exports: `useObjectRef`, `refList`, `mergedRef`, `mergeProps`.

**Design: Prefer mergeRefs and give mergeProps precise composition rules.**

mergedRef names a result rather than an operation; refList exposes flattening mechanics. Keep mergeRefs as the consumer helper and return a callback type. mergeProps currently loses property types and chains every on-prefixed function; specify event order, cancellation, class arrays, style precedence, and ref composition instead of assuming all callbacks are events.

Proposed shape (illustrative):

```ts
type ProposedRef<T> = ((value: T | null) => void) | { current: T | null }
type ProposedMergeRefs = <T>(...refs: readonly ProposedRef<T>[]) => (value: T | null) => void
```

Evidence: [src/ref-list.ts:1](../../../../packages/ui/src/ref-list.ts#L1), [src/merge-props.ts:11](../../../../packages/ui/src/merge-props.ts#L11).

[Audit index](../../README.md)
