# TanStack Start

> TanStack team's full-stack React framework — TanStack Router + Vite
> (or Rsbuild), SSR with hydration by default, typed server functions.
> Read as a routing/data-loading precedent, not a rendering precedent:
> Start has no native story; what it has is the most thorough version of
> "the route file is a config surface" currently shipping.

## What it actually is

A different layer than ours. Start is a _server-side_ framework — server
functions, request middleware, SSR modes, deployment adapters. We own none
of that (apps own their backend — rouzer precedent in text-coral). The
transferable part is narrower and more useful: **Start treats the route
file as the single declaration point for everything a route needs** —
component, guard, loader, head, render mode, param schemas — and codegen
turns that surface into types that flow through `Link`, `navigate`, and
hooks. Our `app/` manifest already does the shallow half of this
(`deriveRouteManifest` + `xplat routes`); Start is the reference for how
deep it can go.

## Conventions worth stealing

### `beforeLoad` guards + inherited route context

Every route can export `beforeLoad({ params, search, context })` — awaited
before the route commits, can `throw redirect(...)`, and whatever it
returns merges into the route `context` that child routes and layouts
inherit. This is the auth-redirect / analytics / feature-gate seam we
don't have: `pushRoute` can't be intercepted today. Largest identified
gap. Fits our conventions directly as a route-file export; returned
context would merge into `useRoute` reads down the `_layout` chain.
Sketched in `docs/navigation-notes.md` → "Route config surface".

### Typed loaders whose data reaches the screen

`loader(params) → T` is typed, and the component reads `T` via
`useLoaderData`. Ours is the same shape minus the data: route-file
`loader` is prefetch-only, the screen re-reads its own `query$`. Typing
the return and surfacing it upgrades prefetch to a real client-side data
seam — no server required. On native it resolves during the transition
and renders into `@try`/`@pending`, which is the path hard-seam #6 in
navigation-notes already describes. `xplat routes` already emits
`RouteParams`; capturing loader return types is the same mechanism.

### `head` per route

`head()` returns title/meta/links per route. Web-only for them — but the
_title_ half isn't: a native `Page` has a nav-bar title. A route-file
`export const head` could carry `<title>` + meta on web and `Page.title`
on native, with web-only keys inert natively (our escape-bag pattern).

### Param + search validation schemas

Routes can declare validators; codegen infers `Link`/`useParams`/search
types from them. We emit all params as `string` (`'demo/:id': { id:
string }`) and stringify leftover params into the query — a `params`
schema export would type `useRoute` props and validate instead of
stringify.

### Per-route render modes, including the middle option

`ssr: true | 'data-only' | false` per route. We already sketched
`+ssr` from One; the contribution here is `data-only` — prerender the
shell and the loader result, hydrate the page client-side. Maps onto our
`loader` prefetch naturally (`+ssrdata`?). Same filename-suffix channel,
ignored on native.

### Middleware as function composition

`createMiddleware().server(fn).client(fn)` — ordered composition wrapping
both requests and server functions. We have no server functions, but the
_shape_ (ordered wrappers around a named operation) is what a
`beforeLoad` chain or nav-intercept would look like if it ever needs to
compose.

## What we don't take

- **Server functions / server routes / request middleware / RSC / ISR /
  deployment adapters** — that's the server layer; it stays app-owned.
  The comparison confirms the boundary is livable: every Start feature in
  that bucket has a client-side or app-side counterpart.
- **The React substrate** — TanStack Router is React-bound; nothing of
  the implementation carries, only the API shapes.

## The docs practice worth copying

Their comparison page (source below) is unusually disciplined: a
capability matrix, explicit "this does not establish a performance
winner," and a caveat that a client loader cache, a cached server result,
and a cached HTML response are _different things_ — "a CDN honoring
`stale-while-revalidate` is not proof of identical ISR behavior." Both
habits apply to us: the cache-layer warning lands verbatim if our loaders
ever gain staleness semantics, and the matrix format is what an honest
xplat-vs-expo-router / react-native-web / tamagui page should look like
once we can claim cells.

## Timing

All of it parked — recorded in `docs/navigation-notes.md` → "Route config
surface" and Silo topic `route-config-surface` (phase 5, parked). The one
thing worth doing while the core settles is pinning the config-surface
vocabulary: **exports carry behavior, `+suffixes` carry
presentation/render mode, `RouteMeta` carries what platforms read** —
cheap to decide now, annoying to rename after apps accumulate route files
(open-questions Q21).

## Sources

- https://tanstack.com/start/latest/docs/framework/react/comparison —
  the Start/Next/RR matrix (checked 2026-09-25)
- https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr
- https://tanstack.com/router/latest/docs/guide/data-loading
