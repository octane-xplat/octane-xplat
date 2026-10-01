# `@xplat/app`

The shared harness app — the screen tree that `apps/web` and `apps/mobile`
both mount. Private; never published. It exists to exercise every
framework seam on real targets, not to be a product.

Exports the mounted root and the app contract:

```ts
import { App, routes, navigate, goBack, useParams } from '@xplat/app'
```

- `app/` holds file-based routes — `_layout.tsrx` is the shell, `[id].tsrx`
  a dynamic segment, `about+modal.tsrx` a modal — compiled into
  `routes.gen.*` per target.
- Screens worth knowing: `Home` (demo gallery host), `Services` and
  `MediaServices` (device-service and media leaves), `Probes` +
  `probes-host.*` (the `pnpm probe` fixture host), `HumanQA`, and
  `VirtualListBenchmark`.
- `platform/` carries the app's own file-boundary splits (nav, file pick,
  benchmarks) — the pattern the framework asks consumers to follow.

The demo screens it routes to live in
[`@xplat/demos`](../demos/README.md); the entry shells and vite configs
live in `apps/web` + `apps/mobile`. Run it with `pnpm probe run <case>
--target <target> --watch` for investigations — see
[`docs/probing.md`](../../docs/probing.md) and
[`docs/testing.md`](../../docs/testing.md).
