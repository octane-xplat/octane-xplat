# @octane-xplat/cli

> `xplat` — the dev/build toolchain for Octane xplat apps (one Octane
> codebase → web + iOS + Android, with an experimental macOS AppKit target).
>
> Status: `0.x` — the API surface is still moving. iOS/Android targets need
> the NativeScript toolchain (Xcode/JDK + `ns`).

```sh
pnpm add -D @octane-xplat/cli
```

```sh
pnpm xplat dev          # pick available targets
pnpm xplat build        # production builds
pnpm xplat build -t macos # experimental AppKit .app + .dmg (Apple Silicon)
pnpm xplat doctor       # environment + framework patch check
pnpm xplat typecheck    # web + native tsconfigs
pnpm xplat patches apply  # install the framework's pnpm patch set into this app
pnpm xplat patches check  # verify the patch set is registered and unmodified
```

The framework carries a small set of upstream fixes as pnpm
`patchedDependencies` (`packages/cli/patches/` + manifest in the published
package). pnpm only honors them at an app's workspace root, so
`xplat patches apply` copies the `.patch` files into `<app>/patches/` and
merges the block into the app's `pnpm-workspace.yaml` (or
`pnpm.patchedDependencies` in package.json). Apps scaffolded by
`create-octane-xplat` already carry the set.

The scaffolded app's `pnpm dev` / `pnpm build` / `pnpm dev:ios` scripts drive
the supported targets directly; `xplat` is the multi-target front end. The
experimental macOS target is configured by the app and packaged by `xplat`.

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
— agents: [llms.txt](https://octane-xplat.goddardai.org/llms.txt)
