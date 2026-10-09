# @octane-xplat/cli

> Run your app, inspect changes with your agent, and check builds for the
> targets you plan to ship.
>
> Status: `0.x` — the API surface is still moving. iOS/Android targets need
> the NativeScript toolchain (Xcode/JDK + `ns`).

For a new app, start with the [creator](../create/README.md). The CLI runs
configured web, iOS, and Android targets, plus opt-in experimental macOS,
Windows, and Linux apps. The Windows scaffold has passed bundle generation
only; launch and runtime behavior remain unverified. See [target support](https://octane-xplat.goddardai.org/spec#choose-your-targets).

For an existing app:

```sh
pnpm add -D @octane-xplat/cli
```

```sh
pnpm xplat dev          # pick available targets
pnpm xplat add ios      # enable a platform skipped at create time
pnpm xplat build        # production builds
pnpm xplat build -t macos # experimental AppKit .app + .dmg (Apple Silicon)
pnpm xplat build -t linux # experimental GTK/WebKit app directory + tar archive
pnpm xplat doctor       # environment + framework patch check
pnpm xplat typecheck    # web + native tsconfigs
pnpm xplat patches apply  # install the framework's pnpm patch set into this app
pnpm xplat patches check  # verify the patch set is registered and unmodified
pnpm xplat fonts add ./Inter.ttf      # .ttf/.otf/.woff/.woff2 → src/fonts + fonts.css + --font-* token
pnpm xplat fonts add @fontsource-variable/inter --install  # Fontsource package
```

The framework carries a small set of upstream fixes as pnpm
`patchedDependencies` (`packages/cli/patches/` + manifest in the published
package). pnpm only honors them at an app's workspace root. For existing apps,
`xplat patches apply` copies the `.patch` files into `<app>/patches/` and merges
the block into the app's `pnpm-workspace.yaml` (or `pnpm.patchedDependencies`
in package.json). Fresh apps from `create-octane-xplat` fetch the
dependency-free `@octane-xplat/patches` package through pnpm
`configDependencies`; their patch paths point into
`node_modules/.pnpm-config/`.

```sh
pnpm xplat patches apply
pnpm xplat patches check
```

Developing an app against a local checkout
(`"@octane-xplat/cli": "link:../octane-xplat/packages/cli"`)? pnpm 11 reads a
`link:` dep's manifest while resolving — before `preinstall` hooks run — so a
linked path that only appears mid-install (for example a symlink a hook
creates) installs without its `node_modules/.bin` shims: `xplat` and
`xplat-lint` come back `command not found`, and later installs report
"Already up to date" without re-linking. Restore the shims with:

```sh
node node_modules/@octane-xplat/cli/src/link-bins.mjs
```

Run it from the app's `postinstall` (after the hook that creates the link
path) so the first install lands them, or reinstall with the path already
present. pnpm 12 links these bins normally.

The scaffolded app's `pnpm dev` / `pnpm build` / `pnpm dev:ios` scripts drive
the supported targets directly; `xplat` is the multi-target front end. The
experimental macOS target is configured by the app and packaged by `xplat`.

```sh
pnpm dev
pnpm build
pnpm dev:ios
```

Linux packaging and its required manifest settings are documented in
[Package a Linux app](../../docs/platform/linux-package.md). The CLI ships the GJS host;
Linux users supply the GTK/WebKit system runtime.

Also exports the native vite preset — it absorbs the app-owned native config
(renderer rules, octane→universal alias, `.ios`/`.android` extension chain,
HMR watchdog, `px→dip` rewrite):

```ts
// vite.config.native.mts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => xplatNative(mode))
```

Docs: [Get a working app and iterate](https://octane-xplat.goddardai.org/toolchain)
— agents: [llms.txt](https://octane-xplat.goddardai.org/llms.txt)

The experimental AppKit preset is exported separately from
`@octane-xplat/cli/macos/vite`:

```js
import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default defineConfig(({ mode }) => xplatMacOS(mode))
```

It resolves the app's `@octane-xplat/macos-renderer` package and installed
Octane compiler. See [AppKit renderer setup](../macos-renderer/README.md) for
application dependencies, root ownership, fonts, and development bundles.

```js
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default await xplatMacOS('production', { entry: 'src/main.mjs' })
```
