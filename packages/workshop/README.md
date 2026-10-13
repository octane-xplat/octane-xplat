# @octane-xplat/workshop

Render an app-owned component on its own development page, edit its inputs,
and Reset to a fresh example. The current preview runs through Octane's real
browser compiler and DOM renderer. Authoring contract version: **1**.

This is package A of the six-target workshop. Native hosts remain unqualified.
Keyboard and browser accessibility semantics have regression coverage; actual
screen-reader announcements and OS IME input still require qualification.

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
import { Pressable, Text, useStore, type Store } from '@octane-xplat/ui'
import { defineStory } from '@octane-xplat/workshop'

type Props = { step: number; label?: string }
type State = { count: number }
type Fixture = { account: string }

function Counter(p: Props & { state: Store<State>; fixture: Fixture }) {
	const { count } = useStore(p.state)
	return <Pressable accessibilityLabel="Increment"
		onPress={() => p.state.set(s => ({ count: s.count + p.step }))}>
		<Text>{p.label ?? p.fixture.account}: {count}</Text>
	</Pressable>
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

## Save and reload

Saving component or story source remounts the selected story with its default
inputs. Search and shell settings remain. A failed edit leaves the last good
stage visibly stale; correcting it restores a fresh successful revision.

```sh
# Keep this command running while saving src/counter.stories.tsrx:
pnpm exec xplat workshop dev --target web --story counter/basic
```

The web adapter uses the pinned Storybook 10.6.1 `composeStory` subset already
used by the private visual harness. Octane owns rendering; workshop owns
cancellation, fixture/provider lifetime and reset. Arbitrary CSF addons are
outside this supported subset. Native composition imports still need their own
host qualification.

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

For repository maintainers, the packed regression builds an external consumer,
runs the same browser acceptance catalog, measures warm HMR, and checks a normal
production bundle for story/fixture/workshop markers. Build the dependencies first.

```sh
pnpm --filter @octane-xplat/lib build
pnpm --filter @octane-xplat/workshop build
pnpm --filter @octane-xplat/workshop test
pnpm --filter @octane-xplat/workshop test:packed
```

The packed check also requires an existing built UI package, as does normal
packed-consumer verification. It uses headless Chromium and captures no images.
