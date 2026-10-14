# useResizable and ResizeHandle

Current exports: `useResizable`, `ResizeHandle`, `pixel`, `percent`.

**Design: Expose a small resize controller and one size representation.**

ResizableSize accepts numbers, unit strings, and wrapper objects; ResizableProps exposes many underscore-prefixed implementation fields. Prefer a public controller with typed state and handle props. Keep internal drag bookkeeping private so consumers do not depend on undocumented fields.

Proposed shape (illustrative):

```ts
type ProposedResizeController = {
	size: { unit: 'px' | '%'; value: number }
	collapsed: boolean
	setSize(value: number): void
	setCollapsed(value: boolean): void
}
```

Evidence: [src/props.ts:5335](../../../../packages/ui/src/props.ts#L5335), [src/props.ts:5404](../../../../packages/ui/src/props.ts#L5404), [src/props.ts:5433](../../../../packages/ui/src/props.ts#L5433).

[Audit index](../../README.md)
