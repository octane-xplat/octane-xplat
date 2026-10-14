# Package entrypoints and discoverability

**Approved D1: Keep general UI at the root and split independent systems by purpose.**

The flat root mixes general UI with independent systems. Keep ordinary forms, layout, and overlays at the root; move routing, data, markdown, and chat to their own subpaths within the same package. Give each API one canonical import and keep its components, hooks, and types together. See [approved decision D1](../../approved-decisions.md) for the boundary and rationale. The whole-package vision places syntax with Markdown initially; further entrypoints need a distinct consumer task.

Proposed shape (illustrative):

```ts
type ApprovedFeatureEntrypoints =
	| '@octane-xplat/ui'
	| '@octane-xplat/ui/routing'
	| '@octane-xplat/ui/data'
	| '@octane-xplat/ui/markdown'
	| '@octane-xplat/ui/chat'
```

**Design: Generate a compact agent-readable contract from the actual exported types.**

Each concept needs its import, props, defaults, supported targets, state model, and one smallest valid example. Generate this from the export map and source comments, with consumer compile checks. It reduces reliance on stale prose and prevents proposed or internal names from being mistaken for shipped APIs.

Proposed shape (illustrative):

```ts
type ProposedApiRecord = {
	importPath: string
	exportName: string
	stateModel: 'controlled' | 'uncontrolled' | 'both' | 'stateless'
	supportedTargets: readonly string[]
	example: string
}
```

Evidence: [package.json:40](../../../../packages/ui/package.json#L40), [src/index.shared.ts:1](../../../../packages/ui/src/index.shared.ts#L1).

[Audit index](../../README.md)
