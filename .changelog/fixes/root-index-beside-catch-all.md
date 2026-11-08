---
hype: 60
---

### Match the index route beside a root catch-all

A route declared with `path: '/'` (or the `index` name) now wins over a root catch-all `path: '*'`, instead of the splat swallowing `/` and making the index route unreachable — requests and typed destinations to `/` hit the catch-all instead. The same precedence now keeps a literal like `docs` ahead of `docs/*`.

```ts
defineRoutes([
  defineRoute({ path: '/' }).screen(Home),
  defineRoute({ path: '*' }).screen(NotFound),
])
// '/' renders Home; '/anything/else' renders NotFound.
```

A catch-all still matches an empty remainder when nothing more specific exists, so a catalog without an index route keeps showing its not-found screen at `/`.

See [author routes](https://octane-xplat.goddardai.org/navigation).
