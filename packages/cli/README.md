# @octane-xplat/cli

> `xplat` — the dev/build toolchain for Octane xplat apps (one Octane
> codebase → web + iOS + Android).

```sh
pnpm xplat dev          # pick targets (web, ios, android) or --targets web,ios
pnpm xplat build        # production builds
pnpm xplat doctor       # environment check
pnpm xplat typecheck    # web + native tsconfigs
```

The scaffolded app's `pnpm dev` / `pnpm build` / `pnpm dev:ios` scripts drive
the same pieces directly; `xplat` is the multi-target front end.

Also exports the native vite preset — it absorbs the app-owned native config
(renderer rules, octane→universal alias, `.ios`/`.android` extension chain,
HMR watchdog, `px→dip` rewrite):

```ts
// vite.config.native.mts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => xplatNative(mode))
```

Docs: [Running and checking an app](https://octane-xplat.goddardai.org/toolchain)
