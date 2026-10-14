# Spacer

Current exports: `Spacer`.

**Keep: Keep Spacer for flexible empty space; use gap for fixed separation.**

Spacer is a recognizable layout helper. Its current props do not express a fixed distance, so adding a second spacing scale would make usage harder to infer. Document its flex behavior and let the containing stack own ordinary separation.

Proposed shape (illustrative):

```ts
type ProposedSpacerContract = {
	flexGrow?: number
}
```

Evidence: [src/props.ts:278](../../../../packages/ui/src/props.ts#L278).

[Audit index](../../README.md)
