# Build, compatibility, and releases

## Build a consumer app

Use the app's enabled scripts. Web production builds do not qualify native
runtime behavior, and an unsigned simulator build is not a signed release.
Read the [toolchain guide](../../../../docs/start/toolchain.md) before native
setup or distribution work.

## Generic syntax in TSRX

If a generic arrow reports JSX parse errors, use a named generic function.
For an optional generic callback, use a callable type alias. The installed
TSRX checker and CLI lint parser reject some otherwise valid TSX forms;
[the toolchain note](../../../../.agents/docs/toolchain.md) records the exact
observed forms and version. This does not change the callback's public type.

```ts
function identity<Value>(value: Value): Value { return value }
type Operation = <Value>(value: Value) => Value
type Options = { run?: Operation }
```

## Builds

```sh
# From the app directory; use only scripts present in package.json.
pnpm build
pnpm build:ios
pnpm build:android
```

Keep the supplied catalog and managed patches together. The compatibility
manifest, installed package versions, and doctor/upgrade output own the current
version set; exact pins copied into prose go stale. Within this repository,
workspace dependencies use `"workspace:*"` and packages declare every import.
The npm CLI runs under Bun >=1.4.3; standalone executables embed it.
Other Node tooling needs Node >=22.18 for direct erasable TypeScript execution;
consumer bundlers still compile framework runtime source.

```sh
pnpm xplat doctor
pnpm dlx @octane-xplat/cli@latest upgrade --check
```

Mason core is the only supported iOS/Android layout engine. Scaffolded apps
declare the core beta through `catalog:xplat`; `xplat upgrade` replaces full
MasonKit and legacy `@triniwiz` pins, and doctor rejects them until it runs.
`xplatNative` resolves the canonical renderer's unchanged `nativescript-masonkit`
imports, including /style, to the app's declared engine under the isolated
linker: core on mobile, full MasonKit in the Windows preview. The private
Windows harness pins full MasonKit 1.0.0-beta.129 for foreign-text wrapping and
frame measurement; do not substitute `masontext` to work around Label layout.
The bounded x64 evidence is in [Windows text wrapping](../../../../docs/platform/windows-setup.md#text-wrapping).
Windows still requires full MasonKit: the managed registry core betas lack Windows artifacts. The
Mason fork can now assemble a Windows-bearing local package, but a local
tarball does not change those registry pins. Keep `xplat upgrade`, doctor and
the harness on full MasonKit until the qualification and delivery gates clear. Core has an independent beta release track;
see the
[extraction design](../../../design/mason-core-extraction.md) for limits.

Core's iOS static framework shares native FontManager through
`@nativescript/font-manager`. Keep a directly declared plugin on the release's
managed pin; `xplat upgrade` aligns it when present. NativeScript handles the
linking, and native dependency updates require an application rebuild.

```sh
pnpm xplat upgrade
pnpm build:ios
```

```json
{
	"dependencies": {
		"@octane-xplat/nativescript-mason-core": "catalog:xplat"
	}
}
```

## Package validation in the framework repository

UI runtime exports ship authored source with generated declaration entrypoints;
the app compiler selects platform leaves. Node tooling ships JavaScript,
including CLI tooling, Bamboo configuration/Vite helpers, the Lingui extractor,
and UI parity helpers. Node-loaded exports and their local imports must ship JavaScript:
Node does not strip TypeScript inside `node_modules`. Keep runtime source exports
for the app compiler. Check each package's export map rather than
assuming one publish format for the repository. Packed-consumer checks establish
installed-package behavior that workspace source checks cannot.

For repository Android plugins, keep Java sources and checked-in AARs aligned.
Inspect an AAR changed by a native build before discarding it; the audio
package's packed-consumer check catches known stale bridge methods. See the
[artifact maintenance note](../../../../.agents/docs/toolchain.md).

```sh
# Repository root: prepare declared package outputs and check exports.
pnpm build:packages
pnpm check:pack
pnpm exec turbo run test:packed --filter=@octane-xplat/updates
pnpm check:consumer --no-build --quick
```

For native patch delivery, run the dedicated tarball and registry-style install
checks. They preserve pnpm's config-dependency fetch and verify every generated
native patch reference. A checkout's version may still name the previous release;
after local dependency upgrades, registry consumers need the next published
lockstep set rather than that checkout's unchanged version number.

```sh
pnpm exec turbo run pack:check test:packed --filter=@octane-xplat/patches
```

`--no-build` skips package builds and packing lifecycle hooks; prepare and
check packages first, as shown above. The quick consumer gate uses isolated
tarballs and compilation. Full consumer journeys and browser checks have
different costs and prerequisites; consult
[release validation](../../../docs/releases.md) before selecting them.

The generic declaration gate pairs runtime and type exports. Keep separate
packed-consumer checks for pure type facades or Node tooling with mixed export
formats; see the [checker boundary](../../../../packages/tsrx-typegen/README.md#publish-checks).

## Build a reusable library

Use the [component-library guide](../../../../docs/app/component-libraries.md)
and creator's `--template library` for web/iOS/Android source packages. Keep
public props/exports aligned, declare app runtimes as peers, and regenerate
ignored declarations before linked consumers check types. A link may resolve
a second physical Octane copy even at the same version; qualify resolution
through the app and finish with a real tarball. Do not treat plain TypeScript
type acceptance as source compilation or native runtime qualification.
tsrx-typegen needs an explicit type on every export (for example `): JSX.Element`); it neither infers across files nor type-checks, so keep `typecheck` in the loop.

```sh
pnpm create octane-xplat travel-controls --template library --name @acme/travel-controls
# In the generated package:
pnpm typegen
pnpm test:packed
```

The repository's focused non-browser qualification packs the creator/framework,
installs an independent library and consuming web app, checks plain TypeScript
conditions and compiles the installed library into production output:

```sh
pnpm exec turbo run test:library --filter=create-octane-xplat
```

## Linked native source packages

Keep the canonical NativeScript Vite patch set when developing against source
packages that also expose compiled tooling subpaths. Both 8.0.20 and 8.0.21
need the collector repair; a patch for one version does not cover the other.
The vendor collector must
classify the requested entry under the native bundler's conditions; a compiled
sibling export does not make the source root vendorable. Keep those roots in
the framework transform pipeline. See the
[mixed-export limitation](../../../../.agents/docs/toolchain.md) and its
maintained collector/bundler regression before removing the patch or adding
vendor exclusions.

```json
{ "exports": { ".": "./src/index.ts", "./parity": "./dist/parity/index.js" } }
```

## CI evidence and publishing

A green `main` push records `ci` evidence, which gates the docs deploy, the
tsrx-typegen release, and lockstep publication. Stable qualification runs on
the bot-maintained `release/lockstep` pull request in `Stable CI`; its
tree-keyed evidence lets a clean merge publish without rerunning the heavy
lanes. Nightlies publish on a daily schedule when publishable files changed.
The PR `checks` job does not install browser engines or run device
emulation. Browser journeys run locally and are not implied by either release
track. The PR-only recipe/link hygiene job is separate from release eligibility.
The [release reference](../../../docs/releases.md) owns the current gate list,
evidence requirements, trusted publishing, and new-package bootstrap procedure.

Do not hand-bump versions, hand-publish real releases, or edit the generated
`CHANGELOG.md` / `FIXLOG.md`. Conventional Commits determine version bumps;
selected Markdown files determine release notes. For meaningful user-facing
features or breaking changes, add `.changelog/*.md`; use
`.changelog/fixes/*.md` only for fixes to bugs a stable release already
shipped. Internal-only work needs no entry.
Follow the [authoring contract](../../../docs/releases.md#write-a-release-note)
for the note format, plain wording, minimal API snippets, and official docs
links.
The one-time package stub/trust bootstrap is an explicit exception covered by
the release reference; it is not a general release workflow.

## Task graph

Use existing root and package scripts so declaration dependencies and caches
remain ordered. Do not substitute a broad repository typecheck for the required
touched-package/dependents filter. Read the
[toolchain reference](../../../docs/toolchain.md) for task definitions and
combined typecheck environments; do not infer runtime platform selection from
TypeScript's fixed suffix order.

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
```
