# Package entrypoints and discoverability

**Design: Keep common components at the root and give advanced helpers feature entrypoints.**

The flat root mixes UI controls with route registries, markdown segmentation, syntax constants, and host services. Preserve convenient root imports for components, while moving advanced supported helpers to explicit feature entrypoints and removing internals. One public concept should have one canonical import; avoid retaining several synonymous root names indefinitely.

Proposed shape (illustrative):

```ts
type ProposedFeatureEntrypoints =
	| '@octane-xplat/ui'
	| '@octane-xplat/ui/navigation'
	| '@octane-xplat/ui/markdown'
	| '@octane-xplat/ui/syntax'
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
