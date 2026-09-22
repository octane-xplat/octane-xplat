# One (onestack.dev)

> Tamagui team's "one codebase, web + native" framework. React-based, replaces
> Metro and the web framework with a single Vite pipeline (vxrn). Derived from
> Expo Router; React Navigation underneath on native.

## What it actually is

Not a primitives library — One delegates components to `react-native` (via
react-native-web on web) and Tamagui. One is the **framework layer**: routing,
data loading, render modes, dev server, production server. That's exactly the
layer where our plan is weakest, which is why it's the most valuable precedent.

## Conventions worth stealing verbatim

### Platform suffixes at route granularity

`.web.tsx` / `.native.tsx` / `.ios.tsx` / `.android.tsx` — same RN convention we
planned — but applied to **route files**, not just leaf components:

```
app/index.tsx       → "/" on native
app/index.web.tsx   → "/" on web
app/blog.web.tsx    → "/blog" on web; no native route at all
```

This makes the suffix resolver a *route-table* mechanism: each platform can
declare divergent navigation, not just divergent rendering. Big idea — adopted
in `docs/navigation.md`.

### `_layout.tsx` composition

Nested layouts wrap all sibling/descendant routes. One ships `<Stack>`,
`<Tabs>`, `<Drawer>`, `<Slot>` as layout components. In our world these map to
`frame`+`page` stacks, `tabview`, `ui-drawer` — the composition contract
(layout provides shell, children slot in) is portable unchanged.

### Render-mode filename suffixes

`route+ssr.tsx`, `route+ssg.tsx`, `route+spa.tsx`, `route+api.tsx`; also
`_layout+ssr.tsx` (shell SSR'd, content client-rendered). On native these are
no-ops — everything is effectively SPA — so shared route files can declare web
semantics harmlessly. Same trick is available to us.

### Loaders

`export loader` per route, Remix-style; runs server-side or pre-navigation,
tree-shaken off clients when unused. Fits Octane's `use()`/Suspense model.

### Typed routes

`one generate-routes` → committed `app/routes.d.ts`, types `Link` params.

### Named exports over default exports

They recommend `export` (not `export default`) for route files because React
Refresh handles it better. Check whether Octane's `hmrUniversalComponent` has
the same preference — likely, since accept-boundary design usually does.

## The hard truth it documents

- Web: stable. Native: **stable only in Metro mode**. The actual Vite-native
  pipeline is on its second implementation (Rolldown `dev()`/`build()`, requires
  Hermes V1) and still alpha; assets/symbolication incomplete.
- Getting a Vite-shaped pipeline onto a non-DOM runtime is the part they found
  hardest — they ship Metro fallback as the stable story.
- Our position is better on this axis and only this axis: `@nativescript/vite`
  was built to boot apps over HTTP ESM and the Octane flavor's on-device HMR
  already works. Our hard parts are the ones One gets free from the RN
  ecosystem: primitives, gestures, nav containers.

## Ecosystem note

One's depth comes from React Navigation + react-native-screens + RNGH +
Reanimated + Tamagui. None of that exists for Octane+NS; the NS analogs are
`frame`/`tabview`/`ui-drawer`, `touch` events, and `view.animate`. See
`docs/animation-gestures.md` for why the JS-on-UI-thread model makes some of
this cheaper than the RN equivalent.

## Sources

- https://onestack.dev/docs/introduction
- https://onestack.dev/docs/routing
- https://onestack.dev/docs/status
