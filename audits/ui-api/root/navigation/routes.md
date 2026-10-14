# Routing and back navigation

Current exports: `pushRoute`, `popRoute`, `routeStacks`, `pushDeepLink`, `routeFor`, `currentRoute`, `currentModalRoute`, `canGoBack`, `useCanGoBack`, `useRoute`, `useModalRoute`, `redirect`, `addBackInterceptor`, `registerScreens`, `registerRoutes`, `addRoutes`, `screenFor`, `hrefFor`, `layoutsForRoute`, `errorBoundaryFor`, `RouteBoundary`, `useBackInterceptor`, `registerStack`, `getStack`, `stackEntries`.

**Design: Separate typed destinations from runtime route state and use familiar navigation verbs.**

pushRoute accepts Route with arbitrary name/params plus loader and context state. Prefer navigate(destination), back(), and replace(destination), with parameters inferred from the manifest. Keep push as an explicit history option. Agents should not construct loaderPending or know a native stack merely to open a screen.

Proposed shape (illustrative):

```ts
type ProposedNavigateOptions = {
	history?: 'push' | 'replace'
	presentation?: 'screen' | 'modal'
	stack?: string
}
```

**Design: Put registration and lookup helpers behind a router instance or integration entrypoint.**

The root exposes screen registries, frame stacks, layout/error-boundary lookups, current getters, and hooks together. Prefer a configured router with scoped state and one reactive reading path; keep host wiring distinct. Define back-interceptor ordering and cleanup, and distinguish a redirect signal from a normal navigation call.

Proposed shape (illustrative):

```ts
type ProposedRouter<TDestination, TRoute> = {
	navigate(destination: TDestination): Promise<void>
	back(): void
	getCurrentRoute(): TRoute | null
	subscribe(listener: () => void): () => void
}
```

Evidence: [src/props.ts:2349](../../../../packages/ui/src/props.ts#L2349), [src/route.web.ts:377](../../../../packages/ui/src/route.web.ts#L377), [src/stacks.ts:16](../../../../packages/ui/src/stacks.ts#L16).

[Audit index](../../README.md)
