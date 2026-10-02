# octane-xplat

Build a TypeScript app for **web, iOS, Android, macOS, Windows, and Linux** with
shared screens and room for each platform to feel right. In a packing app,
for example, adding an item and marking it packed can use the same screen
code on web and mobile; an iOS-only control can live in its own file.

Xplat gives your coding agent a configured starter, shared components, and
project instructions. You describe the flow, inspect the running result, and
ask for the next change.

**Start on web, iOS, and Android with the starter today.** macOS has an
experimental AppKit host; Windows has an experimental WinUI 3 scaffold
whose bundle builds, but has not yet been run on Windows; Linux has an
experimental WebKitGTK webview host exercised on Ubuntu 24.04. The framework is
`0.x`, so plan for API changes as well as platform limits.
See the [target guide](docs/start/spec.md#choose-your-targets) before planning a release.

## Get a working app

With Node.js and pnpm installed ([version requirements](docs/start/toolchain.md#create-and-run)):

```sh
pnpm create octane-xplat my-app
```

The creator installs dependencies and starts the web dev server. Open the
local URL it prints, then open `my-app` in your coding agent. A first task:

> Read AGENTS.md and the Xplat skill. Turn the starter into a trip packing
> checklist: add an item, mark it packed, remove it, and show how many remain.
> Keep the screen shared between web, iOS, and Android. Use in-memory state
> for this first version. Run lint, typecheck, and the web build, and tell me
> which checks passed and which targets you actually ran.

Check the result: add “Passport” and “Charger,” mark Passport packed, and
confirm that one item remains. This first version resets on reload. Then ask
for the next change: “Group items by bag and keep packed items visible.”

The starter includes `.agents/skills/xplat/` for the agent's conventions.
[Run and iterate](docs/start/toolchain.md) shows how to check your first result,
add a native session, and recognize a failed update. You can inspect the
[actual starter screen](packages/create/template/src/App.tsrx) before installing.

## Add useful device features

Save a checklist, attach a photo, share a trip, or open a screen from a link.
[Device services](docs/platform/platform-services.md) and
[media packages](docs/platform/media-services.md) expose those capabilities to shared
code. Availability, permissions, and responses differ by platform: photo
capture uses the OS camera on iOS/Android, while the web flow may offer a
file picker. Handle unavailable features explicitly.

```ts
import { media } from '@octane-xplat/media'

// Call from your Attach photo action.
async function attachPhoto() {
	if ((await media.ensure('camera')) !== 'granted') return null
	return await media.capturePhoto() // null means the user cancelled.
}
```

## Make it feel right on each platform

Share product behavior and the basic screen layout. Use a platform-specific
file when a phone needs an OS control or a desktop needs a different layout.
[Platform variants](docs/platform/module-resolution.md) keep those choices behind a
shared import; [platform widgets](docs/app/primitives.md) provide opt-in OS controls.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// PackingSwitch.ios.tsx
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackingSwitch(props: { value: boolean; onChange: (value: boolean) => void }) {
	return <UISwitch value={props.value} onValueChange={props.onChange} />
}
```

For example, keep a packing row's props and action shared, but put its
`UISwitch` implementation in an `.ios` file. The browser and Android keep
their own implementations; the calling screen keeps one import.

```tsx
// A shared screen imports the module without an OS suffix.
import { PackingSwitch } from './PackingSwitch'

export function PackingRow(props: { packed: boolean; setPacked: (value: boolean) => void }) {
	return <PackingSwitch value={props.packed} onChange={props.setPacked} />
}
```

## What you can verify

The [showcase plan](docs/notes/demos.md#product-showcase) separates four claims and
the evidence each needs:

| Claim                                                       | Evidence available now                                                                                                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One coherent app on all five targets                        | A planned showcase, not a shipped demo. See [target support](docs/start/spec.md#choose-your-targets).                                                                       |
| A shared edit appears in running targets                    | [Recorded web/iOS live-update check](docs/notes/toolchain-notes.md#dev-loop), plus [steps to check your app](docs/start/toolchain.md#see-a-shared-edit-in-running-targets). |
| A useful capability responds appropriately on each platform | [Photo capture behavior and setup](docs/platform/platform-services.md): OS capture on iOS/Android; browser capture or file selection on web.                                |
| A focused implementation fits one platform                  | [File variants and import rules](docs/platform/module-resolution.md) explain how to isolate an OS control.                                                                  |

These are different kinds of evidence: recorded experiments, documented
contracts, and plans. Check the behaviors your app depends on before adopting
it for a release.

## Why Octane and NativeScript

[Octane](https://github.com/octanejs/octane) keeps a familiar React-style
component model and compiles the UI. You and your agent work with components,
props, and state while Xplat supplies shared UI components.

[NativeScript](https://docs.nativescript.org/guide/metadata) exposes native
iOS and Android APIs directly to TypeScript, without requiring you to author
a bridge. Its development update loop helps you inspect edits in a running
app. Its [official agent skills](https://github.com/NativeScript/skills) can
help with native work; they are optional and separate from the starter's
Xplat skill. Follow the [setup and version guidance](docs/start/toolchain.md#agent-context-and-versions)
for this project.

## Docs

**[octane-xplat.goddardai.org](https://octane-xplat.goddardai.org)** —
start with [what you can build](docs/start/spec.md), then
[run your app](docs/start/toolchain.md), [add capabilities](docs/platform/platform-services.md),
and [tailor the experience](docs/platform/module-resolution.md).

For agents: [llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the
docs; [llms-full.txt](https://octane-xplat.goddardai.org/llms-full.txt) includes
every guide. Packages include `@octane-xplat/ui`, `@octane-xplat/platform`,
`@octane-xplat/cli`, and `create-octane-xplat`. For app-chosen bundled icon sets,
use [`@octane-xplat/icons`](packages/icons/README.md).

Working on the framework itself? Start with [AGENTS.md](AGENTS.md) and the
[design notes](docs/notes/architecture-notes.md).

## Framework workspace commands

Run these from the repository root after `pnpm install`:

| Task                                                       | Command                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Start a harness target                                     | `pnpm dev:web`, `dev:ios`, `dev:android`, `dev:macos`, `dev:linux`, or `dev:windows` |
| Build a harness target                                     | `pnpm build:web`, `build:ios`, `build:macos`, `build:linux`, or `build:windows`      |
| Work on the docs site                                      | `pnpm dev:docs` or `pnpm build:docs`                                                 |
| Build workspace packages                                   | `pnpm build:packages`                                                                |
| Run lint and repository checks                             | `pnpm check`                                                                         |
| Generate declarations and typecheck every target           | `pnpm typecheck`                                                                     |
| Run unit, repository-checker, and typegen tests            | `pnpm test`                                                                          |
| Run checks, typechecks, and tests in order                 | `pnpm validate`                                                                      |
| Verify packed UI, GIF, auth, and typegen-fixture consumers | `pnpm test:packed`                                                                   |
| Build and browser-smoke the harness or docs                | `pnpm smoke:web` or `pnpm smoke:docs`                                                |

Individual `typecheck:web`, `typecheck:mobile`, `typecheck:macos`,
`typecheck:linux`, `typecheck:windows`, and `typecheck:docs` commands are also
available. Aggregates stop on the first failure; `validate` does not run
native builds, browser smoke, or all packed-consumer checks.

Native launch and build commands require the target's SDK and host tools.
`build:macos` packages the experimental AppKit app. Browser smoke commands
require Playwright's browser installation. These shortcuts retain the
[existing target limits](docs/start/spec.md#choose-your-targets).
