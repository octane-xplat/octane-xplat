# Route manifests and defineRoutes

Current exports: `deriveRouteManifest`, `defineRoutes`, `mergeRouteManifests`, `manifestToJson`.

**Design: Keep defineRoutes as the authoring path and make derived metadata read-only.**

RouteSpec.screen and errorBoundary are any, and RouteManifest mixes user input with discovered files, layouts, and baked loader results. Type components/loaders from the route params, preserve const inference, and expose a separate immutable derived manifest. Treat duplicate names as errors rather than silently choosing a later definition.

Proposed shape (illustrative):

```ts
type ProposedRouteDefinition<P, Data> = {
	path: string
	loader?: (params: P, options: { signal: AbortSignal }) => Promise<Data>
}
```

Evidence: [src/props.ts:2497](../../../../packages/ui/src/props.ts#L2497), [src/route-table.ts:356](../../../../packages/ui/src/route-table.ts#L356).

[Audit index](../../README.md)
