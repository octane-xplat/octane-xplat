# octane-xplat

> Install and upgrade the shared development tools for an Octane Xplat app.

New apps created with `bun create octane-xplat` or `pnpm create octane-xplat` include `octane-xplat`. It
provides the `xplat` command, formatting, linting, Vite configuration helpers,
and compatible versions of the Octane and TSRX compiler tools. To add it to
an existing app, run this from the app directory:

```sh
bun add -D octane-xplat
bun run xplat --help
```

Use Bun 1.4.4 or later, or pnpm 11.24 or later, plus Node 22.22.2 or later. Follow the
[setup guide](https://octane-xplat.goddardai.org/toolchain) for native prerequisites.
Installing the toolchain does not install Xcode, Android SDKs, or desktop hosts.

## Configure a web app

Import `defineConfig` from `octane-xplat/vite` in `vite.config.ts`. It adds the Octane compiler, platform CSS, module boundary checks, development bridge, and tweak instrumentation. Keep app-specific settings and additional plugins in this file:

```ts
import { defineConfig } from 'octane-xplat/vite'

export default defineConfig({
  server: { port: 5200 },
})
```

The command selects the build target. Web compilation uses browser files and the web runtime, while NativeScript compilation uses the selected OS files and native runtime. The framework supplies matching CSS selection, boundary checks, and dependency resolution. Use the same helper in `vite.config.native.mts` and pass your app's options directly:

```ts
import { defineConfig } from 'octane-xplat/vite'

export default defineConfig({})
```

Direct `vite` invocation defaults to web. Direct `ns run`, `ns build`, and `ns test` use NativeScript's invocation target. You do not need to put platform names in either config:

```sh
bun run xplat dev web
bun run xplat build --targets android
# Direct engine commands also load the framework setup:
bun run vite build
bun run ns build android
```

When migrating an existing config, remove manual `octane()`, `css()`, `boundary()`, `devBridge()`, and `tweaks()` entries, the `native()` wrapper, `nodeEnvDefine()`, and the standard platform conditions and extension list. Keep your own aliases, plugins, server options, and other app settings. Configuration callbacks and promises are supported:

```ts
import { defineConfig } from 'octane-xplat/vite'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/my-app/' : '/',
}))
```

Experimental desktop hosts still use their host-specific presets with Vite's own `defineConfig`. Follow the [macOS](package-build.md) or [Linux](https://octane-xplat.goddardai.org/linux-package) setup for the selected host. Advanced configurations that compose individual framework plugins also use Vite's own helper:

```ts
import { defineConfig } from 'vite'
import { boundary, css } from 'octane-xplat/vite'

// Include these alongside the custom compiler configuration.
const platformPlugins = [css(), boundary()]
export default defineConfig({ plugins: platformPlugins })
```

Run the configured app with these commands. The build creates a `dist/`
directory; typechecking reports source errors without building the app.

```sh
bun run xplat dev web
bun run xplat build --targets web
bun run xplat typecheck
bun run xplat lint
bun run xplat fmt
```

## Keep app dependencies explicit

The umbrella owns development tools. Your app still declares its runtime
packages, selected platform tools, and anything it imports directly under
another package's name. Starters retain Vite for the `vite/client` ambient
types and `@tsrx/oxc` for Octane's compiler peer contract. Testing dependencies
remain app-owned too.

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

For iOS or Android, declare `@octane-xplat/nativescript-octane` in
`dependencies` and `@octane-xplat/vite-octane` in `devDependencies`.
The native preset looks them up in the app's install. The creator adds both
entries when you select a NativeScript target. Keep both versions aligned
with `octane-xplat`. When linking a local checkout, link both owned packages
from the same checkout as the umbrella.

If your app still declares `@nativescript-community/octane` or
`@nativescript-community/vite-octane`, replace those entries before running
`xplat upgrade`. Update direct imports and remove the old renderer patch
registrations. The upgrade command aligns managed versions and external
patches after the package names are in place.

Keep the creator's catalogs and patches. Installing the umbrella alone does
not configure the patches required by the framework. Use the
[upgrade workflow](https://octane-xplat.goddardai.org/toolchain#upgrade-framework-packages)
to preview and apply the supported versions and patches:

```sh
bunx octane-xplat@latest upgrade --check
bunx octane-xplat@latest upgrade
bun run xplat doctor
```

`@octane-xplat/cli` remains available for projects that manage their toolchain
individually. Optional feature packages and native SDKs stay separate from
`octane-xplat`.
