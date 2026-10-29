# Publish a reusable component library

> Develop a small component in an app, then check the package that another app will actually install.

A **library** shares components between apps. It has exports and types but no
app window of its own. Start with the library template's `Badge`, show it in a
separate browser app, then check its tarball before publishing. You need the
[Node and pnpm setup](../start/toolchain.md#create-and-run) and basic familiarity
with editing a component. A coding agent can perform the file edits with you.

This starter targets web, iOS and Android. Its desktop export conditions are
explicitly blocked; extending them requires a host implementation and checks.
A successful browser build does not qualify a phone or desktop runtime.

## Create the package

Run this in the directory that will hold both projects. `@acme/travel-controls`
is an example scoped npm name: replace `acme` with a scope you own before
publishing. The directory can keep the shorter name `travel-controls`.

```sh
pnpm create octane-xplat travel-controls --template library --name @acme/travel-controls
cd travel-controls
pnpm typecheck
pnpm test
pnpm typegen
pnpm test:packed
```

Creation installs the package's development tools; it does not start a server.
The template contains these useful files:

```text
travel-controls/
  src/props.ts                 shared public props
  src/Badge.tsx                iOS/Android component
  src/Badge.web.tsx            browser component
  src/index.ts                 native exports
  src/index.web.ts             browser exports
  tsconfig.types.json          declaration generation settings
  tsrx-typegen.json             public source/type entrypoints
  types/                       generated declarations, ignored by Git
  tests/packed-consumer.mjs     checks a real tarball with plain TypeScript
```

The maintained [library template](../../packages/create/library-template/README.md)
is the example for this guide. `Badge` displays a short label. Its shared props
belong in `src/props.ts`, so both implementations expose the same input:

```ts
export interface BadgeProps {
	label: string
	className?: string
}
```

The template already implements it with shared `View` and `Text` controls.
Keep one element vocabulary per file. Put DOM-only work in a `.web` leaf and
native work in the matching platform leaf, with identical public names and
props. For example, `src/Badge.tsx` uses the shared native JSX contract:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Text, View } from '@octane-xplat/ui'
import type { BadgeProps } from './props'

export function Badge(props: BadgeProps) {
	return <View className={props.className}><Text>{props.label.trim() || 'Badge'}</Text></View>
}
```

The browser sibling uses the same props and component body, with
`/** @jsxImportSource @octane-xplat/jsx/dom */` as its first line. Export the
component and prop type from both barrels; the matching file selection belongs
to the consuming app's target configuration:

```ts
// src/index.ts and src/index.web.ts
export { Badge } from './Badge'
export type { BadgeProps } from './props'
```

## Show the packed library in an app

A **tarball** is the `.tgz` archive users install. Pack into a sibling directory,
then make a fresh browser app next to the library. These commands assume the
generated version is still `0.1.0` and the example package name above; substitute
the actual filename printed by `pack` if you chose another name or version.

```sh
# In travel-controls:
mkdir -p ../artifacts
pnpm pack --pack-destination ../artifacts
cd ..
pnpm create octane-xplat travel-app --targets web
```

Stop the app's initial development server with Ctrl+C, then install the tarball:

```sh
cd travel-app
pnpm add ../artifacts/acme-travel-controls-0.1.0.tgz
```

In `travel-app/src/App.tsrx`, replace the starter component with:

```tsx
import { Badge } from '@acme/travel-controls'

export function App() {
	return <Badge label="Ready for the next trip" />
}
```

Run the app and read the label. Then stop the server and check its production
bundle and types. Fix failures here before publishing:

```sh
pnpm dev
# After stopping the server:
pnpm typecheck
pnpm build
```

The app compiles installed `.ts`, `.tsx` and `.tsrx` runtime source with its
Octane compiler. Generated `.d.ts` files serve type checkers; they are not a
JavaScript build. A plain TypeScript consumer can read those types, but Node
cannot execute this UI package's source directly from `node_modules`.

## Iterate without stale types or duplicate runtimes

First keep using tarballs: after editing a component or public props, rerun
type generation and packing, then install the newly named/versioned artifact
in the app. A previously installed tarball does not change when source changes.
For frequent edits, an app can link the sibling package instead:

```sh
# In travel-controls, regenerate after public source changes:
pnpm typegen
# In travel-app:
pnpm add link:../travel-controls
pnpm why octane
```

Keep Octane and renderer packages as library peers and development dependencies,
so an app supplies the runtime. A link can still resolve a second physical copy
through the library's own development installation. Inspect the resolved graph;
use the app bundler's runtime deduplication/aliases, and check a native build
before relying on a linked native workflow. Matching version strings alone do
not prove a single runtime. Return to tarballs for the final consumer check.
Keep the framework's NativeScript Vite patches when compiling source packages;
do not exclude the library from compilation to hide a transform failure.

Use the template's `catalog:xplat` compatibility set together. The current
starter pins Octane 0.16.3, its Vite plugin 0.5.0, parser 0.20.0, TypeScript 5.9.3
and TypeScript plugin 0.4.11. These are a tested toolchain set, not a claim that
all versions inside a broad peer range work. Inspect the generated workspace
file and doctor output for the installed release, rather than independently
upgrading compiler pieces:

```sh
pnpm exec xplat doctor
pnpm dlx @octane-xplat/cli@latest upgrade --check
```

The current isolated install also reports an optional lint-checker peer mismatch:
`oxlint-tsgolint` 7.0.2002 versus Oxlint 1.90.0's required >=7.0.2005.
Ordinary lint passed; type-aware lint compatibility is not established by that
result. [Issue #76](https://github.com/octane-xplat/octane-xplat/issues/76)
tracks carrying the repository's compatible version into generated workspaces.
Inspect the install rather than silently ignoring a peer warning:

```sh
pnpm peers check
```

For TSRX, follow [current compiler limits](../testing/known-limits.md#same-edge-on-every-target).
Public generics and helpers need positive and negative consumer type assertions;
syntax parsing alone cannot establish their types.

## Keep runtime and type exports aligned

The template owns two export branches: web and native. Each runtime path points
to authored source and each `types` path to generated declarations. Keep the
`types` condition before the branch's runtime default. Desktop nulls deliberately
prevent accidentally treating a native default as desktop support:

```json
{
  "files": ["src", "types", "LICENSE"],
  "exports": {
    ".": {
      "macos": null,
      "linux": null,
      "windows": null,
      "web": { "types": "./types/index.web.d.ts", "default": "./src/index.web.ts" },
      "native": { "types": "./types/index.d.ts", "default": "./src/index.ts" },
      "types": "./types/index.d.ts",
      "default": "./src/index.ts"
    }
  }
}
```

Declare every imported package. Components that share an app runtime belong in
`peerDependencies` with matching development dependencies for local work. A
library-owned engine or native plugin belongs in `dependencies`, with its
required platform metadata/configuration documented for the app. This is a
manifest fragment, not a complete replacement for the template:

```json
{
  "peerDependencies": { "@octane-xplat/ui": "^0.18.0", "octane": ">=0.6.3 <1" },
  "devDependencies": { "@octane-xplat/ui": "catalog:xplat", "octane": "catalog:xplat" }
}
```

Keep images, fonts and other runtime assets inside the packed `files` paths;
inspect the actual archive. Files outside those paths or ignored during packing
will not magically appear in the consumer. An asset's presence does not prove
that native packaging can load it; exercise the consuming target's asset path.
For example, add `src/assets/packing.txt` as disposable test data, then confirm
it and both component leaves are listed. Put these two lines in that text file:

```text
Passport
Charger
```

Then inspect the packed files:

```sh
pnpm pack --pack-destination ../artifacts
tar -tzf ../artifacts/acme-travel-controls-0.1.0.tgz
```

## Generate and check declarations

The template's declaration config emits only declarations from `src` into
`types`. Its `tsrx-typegen.json` maps the public runtime branches to those
outputs. Generated `.js` specifiers within declarations resolve to sibling
`.d.ts` files through TypeScript; consumers do not need `.tsrx` source imports
or `allowArbitraryExtensions` to read the public types.

```sh
pnpm typegen
pnpm exec tsrx-typegen --target octane --check
pnpm exec tsrx-typegen --pack-check
pnpm test:packed
```

`--check` reports stale or missing output without rewriting it. Ignore generated
types and their ownership manifest in Git, but keep `types` in the package's
`files` list. Retain handwritten declarations and overrides outside the generated
directory. After a checkout with no generated types, run `typegen` before local
consumer typechecks. The template's `prepack` regenerates and checks the archive:

```json
{
  "scripts": {
    "typegen": "tsrx-typegen --project tsconfig.types.json",
    "prepack": "pnpm typegen && tsrx-typegen --pack-check"
  }
}
```

The packed-consumer test checks web/native conditions under both Bundler and
NodeNext resolution, including missing/wrong prop errors. Its consumers run
plain TypeScript without a TSRX compiler or importing implementation source.
It does not build an app: also install the tarball into the fresh app above.
For custom declaration layouts and unsupported signatures, follow
[the generator contract](../../packages/tsrx-typegen/README.md), including overrides.

## Prepare publication and future updates

Before any publication, choose your real name/version, description, license
holder and repository URL in `package.json`/`LICENSE`. Confirm the runtime peer
ranges you actually tested, update the README's first use, and run the bounded
checks again:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm test:packed
pnpm pack --pack-destination ../artifacts
```

Open the archive listing; it should contain both runtime leaves, their reachable
declarations, license and required assets, with no credentials or private test
data. Install that exact artifact in a fresh app, check its types/build, then
follow the current [npm scoped public package instructions](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
for your account's publishing rights and authentication. The reader-performed
publication step, from the library directory, is:

```sh
pnpm publish --access public
```

For repeat releases, consider [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
from your own CI. Review its supported providers and permissions in the official
guide. Never put a registry token in app code or the package. Change the package
version for the next release and check a consumer of that version; maintain
compatibility ranges according to your library's policy. The Octane Xplat
repository's lockstep release automation applies to its packages, not to your
independent library.

If types are missing, regenerate and inspect the packed export paths. If a
consumer imports implementation files while checking types, fix its `types`
conditions/declaration references. If web loads a native leaf, inspect export
condition order and the app's target configuration. If a linked app reports
invalid hooks or missing runtime ownership, inspect duplicate Octane resolution
and retry with the isolated tarball. Report the target and exact toolchain used;
a passing browser build does not establish native runtime or asset delivery.
