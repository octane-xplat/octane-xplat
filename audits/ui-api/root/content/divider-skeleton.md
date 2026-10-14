# Divider and Skeleton

Current exports: `Divider`, `Skeleton`.

**Keep: Keep the familiar names and share layout-unit types.**

Divider and Skeleton already describe their jobs. Make orientation explicit for Divider and allow Skeleton to use the same bounded size contract as layout containers. Do not add loading-state ownership to placeholders; the consuming screen should decide when data is ready.

Proposed shape (illustrative):

```ts
type ProposedSkeletonSize = {
	width?: number | `${number}%`
	height?: number
}
```

Evidence: [src/props.ts:3051](../../../../packages/ui/src/props.ts#L3051), [src/props.ts:3063](../../../../packages/ui/src/props.ts#L3063).

[Audit index](../../README.md)
