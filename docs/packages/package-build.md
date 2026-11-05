# @octane-xplat/build

> Configure an existing Octane Xplat app's Vite build with plugins installed
> separately from the `xplat` command.

Use this package when your app needs the shared CSS, platform-boundary, native
compiler or development-action plugins. It provides the Vite presets independently
of the CLI runtime. Start with an [existing app](https://octane-xplat.goddardai.org/toolchain)
and Node 22.22.2 or newer. From the app directory, install the plugins and a
compatible Vite 8 release:

```sh
bun add --dev @octane-xplat/build vite@^8.3.0
```

For a web app, replace the Xplat plugin import in its existing `vite.config.ts`.
Keep every other import and the configuration body, including the Octane compiler,
the plugin options and PostCSS configuration:

```ts
import {
  xplatCss,
  xplatBoundary,
  xplatDevBridge,
  xplatNodeEnvDefine,
} from '@octane-xplat/build/vite'
```

Run the app's production build. For a project that invokes Vite directly, this
command uses the installed tool and writes the output to `dist/`. A module
imported from a foreign platform causes the build to fail instead of silently
shipping that implementation. See [Vite's guide](https://vite.dev/guide/) for
the build tool's own configuration.

```sh
bun run vite build
```

For an existing NativeScript iOS/Android app, keep its NativeScript and Octane
compiler dependencies. In `vite.config.native.mts`, change the preset import
to the build package. Keep the existing preset call and options:

```ts
import { xplatNative } from '@octane-xplat/build/vite'
```

Experimental desktop apps have separate presets. Use the one belonging to your
configured host; changing this import alone does not install a desktop runtime.
The [macOS setup](https://octane-xplat.goddardai.org/toolchain#experimental-appkit-target) and
[Linux packaging guide](https://octane-xplat.goddardai.org/linux-package) own
those prerequisites. Their Vite config imports are:

```ts
import { xplatMacOS } from '@octane-xplat/build/macos/vite'
import { xplatLinuxGtk } from '@octane-xplat/build/linux-gtk/vite'
```

When migrating an existing config, replace only the package prefix in its plugin
imports. Keep the selected preset, options, app entry and other plugins:

```ts
// Previous import: '@octane-xplat/cli/vite'
import { xplatCss } from '@octane-xplat/build/vite'
```

The TypeScript CLI continues to expose its existing plugin paths during the
parallel migration. The experimental Nim package also retains the small Vite
exports, with opt-in engine dependencies; changing to a separate package is not
required for those imports. See [native CLI setup](package-cli.md#native-executable)
for its opt-in engine installation. Command availability remains a separate contract: inspect the
installed CLI's catalog before using it to orchestrate builds.

```sh
bun run xplat catalog --json
```

See the [API reference](https://octane-xplat.goddardai.org/api-build) for options.

The experimental native CLI uses its own selected-project `@octane-xplat/cli/worker` to check development
action input and output. This preserves JavaScript regex/default behavior without
another validator in the native executable. Use a project CLI package compatible with
your native executable; a missing or older worker reports an installation/update hint.
Listing live actions stays native and does not require Node:

```sh
xplat actions list --json
# Use an action and instance from the listing, then follow the returned job.
xplat actions invoke --action ACTION_ID --instance INSTANCE_ID --input '{}' --json
```

For native macOS packaging with the Nim CLI, install the separate
[macOS build worker](package-macos-build.md). Its host assets are not part of
this package.

```sh
bun add --dev @octane-xplat/macos-build
```
