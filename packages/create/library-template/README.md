# octane-xplat-library

A cross-platform component library for Octane Xplat. The starter includes a
small `Badge` component and a packed-consumer check so you can build a package
and check the artifact that will be published.

## Start here

Install this package in an Octane Xplat app:

```sh
pnpm add octane-xplat-library
```

Render the example component from your app:

```tsx
import { Badge } from 'octane-xplat-library'

export function Welcome() {
	return <Badge label="Ready" />
}
```

## Develop and check

Run these commands from the package directory:

```sh
pnpm typecheck
pnpm lint
pnpm lint:fix
pnpm test
pnpm typegen
pnpm test:packed
```

Linting uses the CLI's bundled framework defaults. Apply safe lint fixes with
`lint:fix`; use `format` to format source and `fmt --check` to check formatting
without changing files:

```sh
pnpm format
pnpm exec xplat fmt --check
```

The package publishes authored source for the app's bundler to compile.
`pnpm typegen` generates `.d.ts` files so consumers' type checkers use
declarations. `pnpm test:packed` packs the package, places that artifact into
small web and native TypeScript consumers, and checks both export conditions.

The package sets `nodeLinker: hoisted` in `pnpm-workspace.yaml` because the
NativeScript bundler expects a flat dependency tree.

Its `catalog:xplat` build dependencies and patches follow one framework
compatibility set. Update that set together; consumer `peerDependencies`
ranges are preserved for you to maintain:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade --check
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm xplat doctor
```

## Platform files

`src/Badge.tsx` is the shared iOS and Android implementation. The
`src/Badge.web.tsx` sibling supplies the web implementation. Keep their props
and exports aligned in `src/props.ts` and the two `src/index` barrels. Add
`.ios.tsx`, `.android.tsx`, or `.mobile.tsx` files only when a behavior needs
to differ on those targets.

The starter supports web, iOS, and Android. It does not include app shells or
desktop runtime entries. If the package uses a NativeScript plugin, declare it
as a runtime dependency and add the plugin's required platform files and
metadata to this package.

## Prepare to publish

Before publishing, replace the generated package name and repository metadata
in `package.json`, fill in the year and copyright holder in `LICENSE`, and
confirm that every runtime import is declared. `pnpm test:packed` checks the
package tarball's web and native type exports; it does not build or launch a
consuming app on a device.

Follow [Publish a reusable component library](https://octane-xplat.goddardai.org/component-libraries)
for a complete app-to-tarball workflow, runtime ownership, assets and publication.
