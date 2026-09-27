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
pnpm xplat doctor       # environment check
pnpm xplat typecheck    # web + native tsconfigs
```

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
