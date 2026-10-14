# Web compatibility entrypoint

Current exports: `HoverCard`, `Tooltip`.

**Design: Choose one canonical import for shared hover components.**

The web subpath re-exports HoverCard and Tooltip that now exist at the shared root. Prefer root imports for portable components and use the web entrypoint only for real DOM-specific APIs, such as outline discovery. Keep compatibility aliases clearly deprecated or remove them in the planned breaking release.

Proposed shape (illustrative):

```ts
type ProposedWebEntrypointPolicy = {
	sharedImports: '@octane-xplat/ui'
	domOnlyImports: '@octane-xplat/ui/web'
}
```

Evidence: [src/web/index.ts:1](../../../packages/ui/src/web/index.ts#L1).

[Audit index](../README.md)
