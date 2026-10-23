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
Node tooling needs Node >=22.18 for direct erasable TypeScript execution;
consumer bundlers still compile framework runtime source.

```sh
pnpm xplat doctor
pnpm dlx @octane-xplat/cli@latest upgrade --check
```

The repository's mobile proving harnesses use the core beta. New scaffolded
apps still default to full MasonKit; Windows requires full MasonKit. An
app opting into core declares only the core beta: upgrade preserves it, doctor
rejects overlapping native engines, and `xplatNative` resolves the canonical
renderer imports to core. Do not add full MasonKit to satisfy an older CLI's
missing-engine check. Core has an independent beta release track; Windows is
unqualified. Read the
[extraction design](../../../design/mason-core-extraction.md) before opting in.

```json
{
	"dependencies": {
		"@octane-xplat/nativescript-mason-core": "1.0.0-beta.0"
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

`--no-build` skips package builds and packing lifecycle hooks; prepare and
check packages first, as shown above. The quick consumer gate uses isolated
tarballs and compilation. Full consumer journeys and browser checks have
different costs and prerequisites; consult
[release validation](../../../docs/releases.md) before selecting them.

The generic declaration gate pairs runtime and type exports. Keep separate
packed-consumer checks for pure type facades or Node tooling with mixed export
formats; see the [checker boundary](../../../../packages/tsrx-typegen/README.md#publish-checks).

## CI evidence and publishing

Nightly readiness uses `CI`; stable qualification uses `Stable CI` for the same
revision. The PR `checks` job does not install browser engines or run device
emulation. Browser journeys run locally and are not implied by either release
track. The PR-only recipe/link hygiene job is separate from release eligibility.
The [release reference](../../../docs/releases.md) owns the current gate list,
evidence requirements, trusted publishing, and new-package bootstrap procedure.

Do not hand-bump versions, hand-publish real releases, or edit the generated
`CHANGELOG.md` / `FIXLOG.md`. Conventional Commits determine version bumps;
selected Markdown files determine release notes. For meaningful user-facing
features or breaking changes, add `.changelog/*.md`; use
`.changelog/fixes/*.md` for bug fixes. Internal-only work needs no entry.
Follow the [authoring contract](../../../docs/releases.md#write-a-release-note)
for the release header, plain wording, minimal API snippets, and official docs
links. Reserve the [glossary](../../../../GLOSSARY.md) for bespoke terms or
local meanings that differ from what an agent would normally assume.
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
