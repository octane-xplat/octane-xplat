# @octane-xplat/workshop

Render an app-owned component on its own development page, edit its inputs,
and Reset to a fresh example. The current release provides real launch paths
for three hosts: the **web** browser target, **macOS** through the real AppKit
renderer on the JavaScriptCore NativeScript host, and **Linux** through the
real GTK4 renderer (`@octane-xplat/linux-gtk`) in a GJS window. Authoring contract
version: **1**.

[iOS/Android launch setup](MOBILE.md) and native adapters are implemented,
but iOS, Android and Windows remain unqualified backends — `xplat workshop
doctor` reports them honestly. Keyboard and browser accessibility semantics
have regression coverage; actual screen-reader announcements and OS IME input
still require qualification on every host. On macOS, scripted interaction
dispatches through each view's real recognizer or control action — it is not
OS-synthesized input or hit-testing. On Linux, GTK widget input/focus, Mason layout, and reload semantics remain
actual-Linux-host gates (non-Linux GJS is a development stand-in, not
qualification).

For Windows prerequisite reporting and the blocked native launch, see
[Windows workshop setup status](WINDOWS.md). Windows mounting and interaction
remain incomplete; setup checks do not qualify that host.

## Try it

Inside an existing Octane Xplat app, install the development tooling. Keep the
app's existing matching Octane/compiler versions; the app template already
provides Octane's compiler peers, including `@tsrx/oxc`.

```sh
pnpm add -D @octane-xplat/workshop @octane-xplat/cli @octanejs/vite-plugin vite
pnpm exec xplat workshop init
pnpm exec xplat workshop dev --target web
```

Open the printed URL and choose **Workshop / Counter**. Press **Increment**:
the count increases. Change **step**, leave the field, and press again. **Reset**
restores the initial count and step.

Initialization creates `workshop.config.ts`, a local example story, and an
optional package script. Existing files and app entries remain intact. Run it
again to check that the configuration is already present.

```sh
pnpm exec xplat workshop init
pnpm exec xplat workshop doctor
pnpm exec xplat workshop list
```

## Declaring stories

A story is a named example of your component. Save this in
`src/counter.stories.tsrx`; `args` supplies its initial inputs, and the controls
form edits only the declared portable prop values.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'
import { useStore, type Store } from '@octane-xplat/ui/data'
import { defineStory } from '@octane-xplat/workshop'

type Props = { step: number; label?: string }
type State = { count: number }
type Fixture = { account: string }

function Counter(p: Props & { state: Store<State>; fixture: Fixture }) {
	const { count } = useStore(p.state)
	return (
		<Pressable
			accessibilityLabel="Increment"
			onPress={() => p.state.set((s) => ({ count: s.count + p.step }))}
		>
			<Text>
				{p.label ?? p.fixture.account}: {count}
			</Text>
		</Pressable>
	)
}

export const Basic = defineStory<Props, State, Fixture>({
	id: 'counter/basic',
	title: 'Examples / Counter',
	targets: 'all',
	component: Counter,
	args: { step: 1 },
	controls: {
		step: { type: 'number', min: 1, max: 10 },
		label: { type: 'string', allowUnset: true },
	},
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'Demo' }),
})
```

IDs address stories across reloads. Metadata must be literal: discovery reads
it without evaluating the story or importing an incompatible platform leaf.
Computed metadata and duplicate IDs produce catalog diagnostics. Use literal
strings without escape sequences and literal arrays without expression suffixes.

```ts
// Inside the Basic declaration above:
id: 'counter/basic',
title: 'Examples / Counter',
targets: ['web', 'ios'],
```

`state` and `fixture` are reserved prop names. The runner supplies a fresh store
and resolved fixture for each generation; return new nested data from factories.
The native readers of a store must subscribe with `useStore`, as Counter does.

```ts
// Inside the Basic declaration:
state: () => ({ count: 0 }),
fixture: () => ({ account: 'Demo' }),
```

## State-preserving controls vs. full reset

Control edits keep the current fixture, providers, store and component-local
state. **Unset** removes an optional value; required props cannot be unset.
Empty, non-finite or out-of-range numbers show a field error and keep the last
valid stage value. **Reset** creates a fresh complete generation.

```ts
// Inside the Basic declaration:
controls: {
	step: { type: 'number', min: 1, max: 10 },
	label: { type: 'string', allowUnset: true },
},
```

## Owned fixture resources

Register cleanup as soon as a fixture acquires a resource. Preparation has a
10-second default budget. Rejection offers Retry/Reset; cancellation prevents
stale content mounting. Cleanup starts in reverse registration order, attempts
all entries, and awaits the combined result before another generation. A hung
or rejected cleanup requires target restart, including failures in late cleanup.

```ts
// Replace Basic's fixture factory with this local timer example:
fixture: ({ signal, onCleanup }) => {
	const timer = setInterval(() => {
		if (!signal.aborted) console.log('Demo fixture is active')
	}, 1000)
	onCleanup(() => clearInterval(timer))
	return { account: 'Demo' }
},
```

Providers wrap the compiled component; global presets wrap story-specific
providers. Each owned secondary root needs the same explicit provider data and
its own registered cleanup. The maintained
[isolation example](../../apps/workshop-demo/src/stories/isolation.stories.web.tsrx)
shows an actual secondary Octane root, shared provider store, and disposal.

```tsx
function DemoProvider(p: { fixture: Fixture; children?: unknown }) {
	return p.children
}
// Inside the Basic declaration:
providers: [DemoProvider],
```

Stories do not sandbox imported module globals, external stores or OS resources.
If those cannot recover cleanly, stop and restart the development target.

```sh
# Stop the running development command with Ctrl+C, then:
pnpm exec xplat workshop dev --target web --story counter/basic
```

## Linux host

On Linux the workshop renders chrome and stories directly with GTK4 through
`@octane-xplat/linux-gtk` — no WebKitGTK or DOM is involved. `xplat workshop dev
--target linux` builds the chrome shell for GJS and the story bundle for the
NativeScript-dialect renderer, then drives the window over stdin.

```sh
pnpm exec xplat workshop dev --target linux
pnpm exec xplat workshop dev --target linux --story counter/basic
```

The launch needs `gjs` plus the GTK4 typelib (on Debian/Ubuntu: `gjs
libgtk-4-1 gir1.2-gtk-4.0`) and `@octane-xplat/linux-gtk` resolvable from the
app — it is a private in-repo package, so the Linux workshop is in-repo until
it publishes. `xplat workshop doctor` probes them without opening a window.
A missing XplatMason typelib warns and falls back to `Gtk.Box` layout. On
macOS a Homebrew GJS run is a development stand-in, not Linux qualification.

Linux stories resolve `.gtk` leaves ahead of shared modules; a story listing
`linux` under `targets` mounts, while foreign leaves stay out of the bundle.
`.stories.linux.*` files are no longer part of the Linux catalog — discovery
emits a diagnostic telling the author to rename to `.stories.gtk.*` (or keep
`.stories.web.*` for `--target web`). DOM stories remain previewable with
`--target web`.

## Platform-leaf filtering

A platform-suffixed declaration has no loader on an incompatible target.
It stays visible with its reason. Required capabilities are currently
unknown/unqualified in this preview and cannot silently become supported.

```ts
// A story saved in counter.stories.ios.tsrx:
id: 'counter/ios-only',
title: 'Examples / iOS counter',
targets: ['ios'],
```

## Shell

Search by title or ID. Wide windows show catalog, stage and controls; narrower
windows open Stories or Controls separately. Escape closes a workshop panel and
restores its opener. Composition Enter does not apply a draft. Stage-only mode
keeps an accessible return/Reset action. Environment background and bounds are
preview settings, separate from component props; changing them keeps the session.
The target menu lists all six real host statuses without simulating a host.

```sh
pnpm exec xplat workshop dev --target web --story counter/basic
```

The browser chrome follows the system light/dark preference and existing app
theme tokens. Selection, hover and keyboard focus remain distinct; narrow
windows wrap toolbar actions instead of hiding them. Chrome adds no animation
and keeps the specimen's default background and text colors separate. Native
shells retain platform controls and focus indicators. Their presentation changes
still need actual-host verification.

## Save and reload

Saving component or story source remounts the selected story with its default
inputs. Search and shell settings remain. A failed edit leaves the last good
stage visibly stale; correcting it restores a fresh successful revision.

```sh
# Keep this command running while saving src/counter.stories.tsrx:
pnpm exec xplat workshop dev --target web --story counter/basic
```

The DOM-host adapter uses the pinned Storybook 10.6.1 `composeStory` subset
already used by the private visual harness. Octane owns rendering; workshop
owns cancellation, fixture/provider lifetime and reset. Arbitrary CSF addons
are outside this supported subset. Other native composition imports need their
own host qualification.

## macOS target

The `macos` target runs the same catalog and session in a small AppKit shell on
the real JavaScriptCore/NativeScript host — the same runtime `xplat dev` uses
for packaged macOS apps. It needs a macOS arm64 machine and the app's matching
macOS dependencies (`@octane-xplat/macos-renderer` and
`@nativescript/macos-node-api`). Story windows and sheets opened through `openWindow` or
`mountSheet` are workshop-owned and close when the story generation retires.

```sh
pnpm exec xplat workshop dev --target macos
```

Set `OCTANE_WORKSHOP_OFFSCREEN=1` to run the window without desktop focus, and
`OCTANE_MACOS_AUTOMATION=1` to enable the stdin qualification protocol
(`catalog`, `select`, `control`, `unset`, `press`, `reset`, `query`, `panel`,
`stage-only`, `status`, `close`).

## Commands

Run these from the consuming package, rather than the monorepo root.

```sh
pnpm exec xplat workshop init
pnpm exec xplat workshop doctor
pnpm exec xplat workshop list
pnpm exec xplat workshop dev --target web --story counter/basic
```

Configure includes/excludes, global provider modules and static assets explicitly.
Relative provider and asset paths resolve from the consuming app.

```ts
import { defineWorkshopConfig } from '@octane-xplat/workshop'

export default defineWorkshopConfig({
	stories: { include: ['src/**/*.stories.tsrx', 'src/**/*.stories.web.tsrx'] },
	assets: { examples: './public' },
})
```

## Production exclusion

Keep stories out of the production app's imports. The workshop creates a separate
development page and does not replace the app's production entry. Build the
ordinary app to ship it; installing workshop as a development dependency alone
does not exclude a story explicitly imported by production code.

```sh
pnpm run build
```

For repository maintainers, the packed regression compiles source in an external consumer,
runs the same browser acceptance catalog, measures warm HMR, and checks a normal
production bundle for story/fixture/workshop markers. Generate dependency declarations first.

```sh
pnpm --filter @octane-xplat/lib typegen
pnpm --filter @octane-xplat/ui typegen
pnpm --filter @octane-xplat/workshop typegen
pnpm --filter @octane-xplat/workshop test
pnpm --filter @octane-xplat/workshop test:packed
pnpm --filter @octane-xplat/workshop test:packed:linux
```

The packed checks compile the published source with the consumer's toolchain.
They use headless Chromium and capture no images.
The Linux packed check verifies packed export resolution, catalog
applicability (including the `.stories.linux.*` diagnostic lane) and
production-build exclusion statically — the GJS window, GTK input/focus and
reload remain actual-host gates that no static check substitutes for.
