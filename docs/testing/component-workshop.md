# Develop a component in the workshop

> Develop one component in a separate preview, edit its inputs, reset its state, and keep the preview out of your production app.

Start with a counter you can change without navigating through the rest of your
app. A **story** is a named example of a component; its controls let you change
explicit inputs, while Reset starts that example with fresh data.

You need a configured Octane Xplat app with its matching compiler/runtime. Start
with the browser path below. Desktop hosts and unqualified mobile/Windows paths
are described after the first working story; choosing a target in the shell
does not simulate that target. The authoring contract version is **1**.

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

Once the generated counter works, add a component example of your own. The
maintained [counter story](../../apps/workshop-demo/src/stories/counter.stories.tsrx)
and [component](../../apps/workshop-demo/src/counter.tsrx) use this same typed
contract and are exercised in the isolated packed consumer. Save this example in
`src/counter.stories.tsrx`; `args` supplies its initial inputs, and the controls
form edits only the declared portable prop values. IDs address stories across
reloads. Keep `id`, `title`, and `targets` literal: discovery reads them without
running the module. Computed metadata and duplicate IDs produce diagnostics.

`state` and `fixture` are reserved props supplied by the runner. Their factories
return fresh data for each generation. Native readers subscribe with `useStore`,
as `Counter` does here:

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
			onPress={() => p.state.update((s) => ({ count: s.count + p.step }))}
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

## State-preserving controls vs. full reset

Control edits keep the current fixture, providers, store and component-local
state. **Unset** removes an optional value; required props cannot be unset.
Empty, non-finite or out-of-range numbers show a field error and keep the last
valid stage value. **Reset** creates a fresh complete generation.

| Action | Props | Component, store, fixture and providers |
| --- | --- | --- |
| Edit a valid control | Apply the new value | Keep the current generation |
| Unset an optional prop | Remove its key so the fallback applies | Keep the current generation |
| Reset | Restore defaults | Dispose and create a fresh generation |
| Save a valid source edit | Restore defaults | Mount a fresh revision; retain shell settings |
| Save a bad source edit | Retain the last good values | Mark the last good stage stale until correction |


To reuse the controls from `Basic`, declare them in the same file and set its
`controls` property to this value:

```ts
import type { StoryControls } from '@octane-xplat/workshop'

const controls: StoryControls<Props> = {
	step: { type: 'number', min: 1, max: 10 },
	label: { type: 'string', allowUnset: true },
}
```

## Owned fixture resources

Register cleanup as soon as a fixture acquires a resource. Preparation has a
10-second default budget. Rejection offers Retry/Reset; cancellation prevents
stale content mounting. Cleanup starts in reverse registration order, attempts
all entries, and awaits the combined result before another generation. A hung
or rejected cleanup requires target restart, including failures in late cleanup.

In the same file, define this factory and set `Basic`'s `fixture` property to
`fixture`. Resetting the story releases the old timer before starting another:

```ts
import type { FixtureFactory } from '@octane-xplat/workshop'

const fixture: FixtureFactory<Fixture> = ({ signal, onCleanup }) => {
	const timer = setInterval(() => {
		if (!signal.aborted) console.log('Demo fixture is active')
	}, 1000)
	onCleanup(() => clearInterval(timer))
	return { account: 'Demo' }
}
```

Providers supply context around the compiled component. For example,
`SizeProvider` gives field/button controls an inherited size. Global presets wrap story-specific
providers. Each owned secondary root needs the same explicit provider data and
its own registered cleanup. The maintained
[isolation example](https://github.com/octane-xplat/octane-xplat/blob/main/apps/workshop-demo/src/stories/isolation.stories.web.tsrx)
shows an actual secondary Octane root, shared provider store, and disposal.

```tsx
import { SizeProvider } from '@octane-xplat/ui'

function DemoProvider(p: { fixture: Fixture; children?: unknown }) {
	return <SizeProvider size="lg">{p.children}</SizeProvider>
}
// Use this array for Basic's providers field:
const providers = [DemoProvider]
```

The counter above uses a Pressable/Text pair; to inspect inherited field/button
size, use this provider on a story whose component contains those controls.

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

This is currently a repository development path: the GTK renderer is private
and was unavailable from the public npm registry in this review. Supported
consumer distribution is tracked in [Linux support #63](https://github.com/octane-xplat/octane-xplat/issues/63).
Do not treat the command above as a fresh npm installation path. A configured
checkout needs `gjs`, the GTK4 typelib (on Debian/Ubuntu: `gjs libgtk-4-1
gir1.2-gtk-4.0`), and the checkout renderer resolvable as
`@octane-xplat/linux-gtk`. `xplat workshop doctor` probes these without opening a window.
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

To make an iOS-only variant, save the earlier component, imports, and types in
`counter.stories.ios.tsrx`, and replace its story declaration with:

```ts
export const IOSOnly = defineStory<Props, State, Fixture>({
	id: 'counter/ios-only',
	title: 'Examples / iOS counter',
	targets: ['ios'],
	component: Counter,
	args: { step: 1 },
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'Demo' }),
})
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

The DOM-host adapter uses the pinned Storybook 10.6.5 `composeStory` subset
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
	stories: {
		include: ['src/**/*.stories.tsrx', 'src/**/*.stories.web.tsrx'],
		exclude: ['src/private-fixtures/**'],
	},
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
pnpm exec turbo run typegen --filter=@octane-xplat/lib
pnpm exec turbo run typegen --filter=@octane-xplat/ui
pnpm exec turbo run typegen --filter=@octane-xplat/workshop
pnpm exec turbo run test --filter=@octane-xplat/workshop
pnpm exec turbo run test:packed --filter=@octane-xplat/workshop
pnpm exec turbo run test:packed:linux --filter=@octane-xplat/workshop
```

The packed checks compile the published source with the consumer's toolchain.
They use headless Chromium and capture no images.
The Linux packed check verifies packed export resolution, catalog
applicability (including the `.stories.linux.*` diagnostic lane) and
production-build exclusion statically — the GJS window, GTK input/focus and
reload remain actual-host gates that no static check substitutes for.

## Platform support and evidence

[iOS/Android launch setup](https://github.com/octane-xplat/octane-xplat/blob/main/packages/workshop/MOBILE.md) and native adapters are implemented,
but iOS, Android and Windows remain unqualified backends — `xplat workshop
doctor` reports them honestly. Keyboard and browser accessibility semantics
have regression coverage; actual screen-reader announcements and OS IME input
still require qualification on every host. On macOS, scripted interaction
dispatches through each view's real recognizer or control action — it is not
OS-synthesized input or hit-testing. On Linux, GTK widget input/focus, Mason layout, and reload semantics remain
actual-Linux-host gates (non-Linux GJS is a development stand-in, not
qualification).

For Windows prerequisite reporting and the blocked native launch, see
[Windows workshop setup status](https://github.com/octane-xplat/octane-xplat/blob/main/packages/workshop/WINDOWS.md). Windows mounting and interaction
remain incomplete; setup checks do not qualify that host.

## Check your own component

1. Open the browser story and activate its primary action. Confirm the visible
   result, then change a control and confirm the next action uses that value.
2. Change component-local/store state. Edit a control without resetting it;
   then Reset and confirm defaults, nested data and fixture resources are fresh.
3. Unset an optional prop and confirm its fallback. Try an invalid number and
   confirm it reports an error while preserving the last valid preview.
4. Switch/reset while a fixture is preparing. Its late result must not mount;
   resource cleanup must finish before the next generation. Restart after a
   cleanup failure instead of treating a partially disposed session as healthy.
5. Save a valid component change, introduce a controlled syntax error, and
   correct it. Check fresh revisions, stale-preview feedback and recovery.
6. Use search, panels, Reset and stage-only mode with a keyboard. Check actual
   screen-reader and IME behavior on the intended host separately.
7. Build the ordinary app entry and verify it imports no stories, workshop
   tooling or fixture-only data. A development-only dependency is insufficient
   if production source imports it.

The browser packed check compiles real tarballs in an isolated consumer and
runs DOM/input, controls, reset, reload and production-exclusion checks. It does
not qualify native OS input, assistive technology or other hosts. Keep actual
consumer/build/runtime evidence separate from a successful story typecheck.
