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

Import configuration helpers from `octane-xplat/vite`. This entry combines
Vite's `defineConfig` and `mergeConfig`, Octane's compiler plugin, and the
[Xplat platform presets](https://octane-xplat.goddardai.org/package-cli#native-vite-preset).
For example, a web app's `vite.config.ts` can contain:

```ts
import { defineConfig, octane, xplatCss, xplatBoundary } from 'octane-xplat/vite'

export default defineConfig({
  plugins: [xplatCss('web'), ...octane(), xplatBoundary('web')],
  resolve: {
    conditions: ['web'],
    extensions: [
      '.web.tsrx', '.tsrx', '.web.tsx', '.tsx', '.web.ts',
      '.mjs', '.mts', '.ts', '.jsx', '.js', '.json',
    ],
  },
})
```

The platform resolver included by `xplatBoundary('web')` also applies this
extension order when Vite prepares dependencies for development. This keeps
a dependency's browser file ahead of its native sibling. Custom optimizer
extension lists take precedence; only set one when you need a different order:

```ts
// Optional addition to the Vite config above:
const optimizeDeps = {
  rolldownOptions: { resolve: { extensions: ['.web.ts', '.ts', '.js'] } },
}
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
