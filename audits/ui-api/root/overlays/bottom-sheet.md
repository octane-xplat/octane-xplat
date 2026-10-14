# BottomSheet and its service

Current exports: `BottomSheet`, `BottomSheetSwitcher`, `openBottomSheet`, `closeBottomSheet`.

**Design: Unify declarative and imperative options and type the closing result.**

BottomSheet has required label and isOpen; the imperative options make label optional and return unknown. Height and snap points both accept broad strings. Use one named options contract, a typed result, and a small snap-point grammar; close the returned sheet handle rather than relying on a global close call.

Proposed shape (illustrative):

```ts
type ProposedSnapPoint = number | `${number}%`
type ProposedSheetHandle<T> = {
	result: Promise<T | null>
	close(result?: T): void
}
```

Evidence: [src/props.ts:1954](../../../../packages/ui/src/props.ts#L1954), [src/props.ts:1962](../../../../packages/ui/src/props.ts#L1962), [src/props.ts:2026](../../../../packages/ui/src/props.ts#L2026).

[Audit index](../../README.md)
