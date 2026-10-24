# Primitives

Import the shared surface from `@octane-xplat/ui`. Shared components use
platform leaves behind the same import; platform-authentic widgets use the
conditional `@octane-xplat/ui/ios`, `/android`, or `/web` subpaths. Those
subpaths resolve only for their target, so keep imports in a matching
platform-suffixed file. A runtime branch does not prevent an incompatible
static import from loading.

```tsx
import { HStack, Text } from '@octane-xplat/ui'

export function PackingRow() {
	return (
		<HStack>
			<Text>Passport</Text>
			<Text>Packed</Text>
		</HStack>
	)
}
```

**For UI contributors**, shared component prop contracts live in
`packages/ui/src/props.ts` and feed published declarations. Consumer app
components own their own props; do not edit framework internals to define them.

## Shared surface

Use the [component guide](../../../../docs/app/components.md) to choose a
component, and the public declarations/export map for exact names and props.
State and routing operations have dedicated `/data` and `/routing` entrypoints;
visual components stay at the root.

Check the [normalization contract](../../../../docs/start/architecture.md#normalization-classes)
when deciding which appearance and behavior must match across targets.

`Switch`, `Slider`, `Spinner`, `Tabs`, `Drawer`, and the color suite
(`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorSwatch`, `ColorField`) are
self-drawn shared components: their shared props produce the same component
design across targets, rather than exposing OS chrome. Color parts report
`'#rrggbb'` hex through `onChange`/`onChangeEnd`; `ColorSlider` is hue-only
and drags are delta-based like `Slider`. `Slider` follows pan
deltas and does not jump to a tapped track position. On web it is a Tab stop:
Arrow keys change 1% of its range, and Home/End choose the bounds. Pair
`value` with `onValueChange` to display the change. `Drawer` has no edge-swipe
gesture on web; provide a visible toggle. `TextInput`, `TextArea`, and
`ScrollableArea` remain OS-backed with normalized chrome because text editing and
scroll behavior belong to the platform.

```tsx
import { useState } from 'octane'
import { Drawer, Switch, Slider, Spinner, TextInput } from '@octane-xplat/ui'

export function Controls() {
	const [packed, setPacked] = useState(false)
	const [volume, setVolume] = useState(50)
	return (
		<>
			<Switch checked={packed} onCheckedChange={setPacked} />
			<Slider value={volume} onValueChange={setVolume} />
			<Spinner />
			<TextInput label="Bag name" />
			<Drawer
				open={false}
				main={<TextInput label="Packing notes" />}
				drawer={<TextInput label="Drawer notes" />}
			/>
		</>
	)
}
```

## Platform-authentic subpaths

The OS widget is the value of these exports. They are intentionally absent
from the shared root barrel.

Choose an OS subpath when platform chrome is the intended behavior. The
[platform widgets guide](../../../../docs/app/primitives.md) and package export
map own the complete inventory; import only names declared by that subpath.
For example, an iOS switch belongs in an `.ios` leaf:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// PackingToggle.ios.tsx
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackingToggle() {
	return <UISwitch checked={false} onCheckedChange={console.log} />
}
```

## Removed from the shared surface

- `Modal` has no shared root export. `List`/`ListItem` now provide a bounded
  content list; use `VirtualList` for long windowed collections. Shared
  `Dialog`/`BottomSheet`/`Overlay` own temporary surfaces, while
  `UIModal`/`MaterialDialog` provide platform-authentic modal UI.
- `openModal`, `PlatformBadge`, and the shared `glass` container prop are not
  root exports. `openModal` is available only from iOS and Android subpaths.
  `HoverCard` and `Tooltip` are shared root exports; qualify pointer/touch
  behavior per target and keep essential information in visible content.

## Contracts that differ from DOM/React habits

- **Removing a prop restores its default.** A prop that disappears between
  renders — or is passed `undefined`/`null` — resets to the value it holds
  when never supplied (per-key inside `style` too), on web, iOS, Android,
  and macOS. A nullable API may explicitly give `null` a meaning; otherwise
  pass `''`, `0`, or `false` when the default is not the value you want.
- **`on*` props re-commit every render** — inline closures always read
  current state. A listener you attach yourself (`view.on('pan', fn)` in an
  effect or ref callback) binds once at mount and keeps the mount-render
  closure; read live state through a ref or `useEffectEvent`, and clean it
  up on detach.
- **`ref` is the binding prop** (`bind` was removed — see
  docs/app/primitives.md#migrate-from-bind). `View`/`Pressable` forward the
  host view; controls expose documented handles instead
  (`TextInputHandle` = `focus`/`blur`/`native`). On native the handle can
  arrive before the view's OS peer is `loaded` — gate peer-specific work on
  load, not ref assignment.
- **`Grid` places children by forwarded props.** `row`/`col` are
  zero-based; a composite cell must spread its placement props onto its own
  root view or it auto-places. `gap` was removed — space children with
  margins. Native components translate placement to CSS grid styles and Mason
  performs layout; the former imperative placement pass is gone. Measure after
  layout rather than assuming coordinates update synchronously with state.
  For bounded cells, use CSS zero-minimum tracks and omit the corresponding
  `rows`/`columns` prop so CSS owns that axis; see
  [Grid placement](../../../../docs/app/primitives.md#grid-placement).
- **Use `ScrollableAreaHandle` for scroll commands.** Mobile/Windows native
  hosts are Mason wrappers, not NativeScript ScrollView instances. Use the
  portable command; iOS currently moves instantly even with `animated: true`.

  ```ts
  import type { ScrollableAreaHandle } from '@octane-xplat/ui'
  function showStart(viewport: ScrollableAreaHandle) {
      viewport.scrollToOffset({ block: 0 })
  }
  ```

- **Text controls report the new string.** `TextInput`'s `onChange` gets
  `value: string`, not an event; controlled `value` writes suppress their
  own echo. `useKeyboardInset()` returns the keyboard inset in dips — zero
  on web/desktop, and on Android it leases window resize, so don't also add
  it as padding there or you double-avoid.
- **Hosted surfaces normalize the frame, not the content.** `WebView`,
  `Video`, `CameraView` render engine-owned pixels — identical props,
  different engine behavior per target. Check `docs/testing/known-limits.md`
  before promising parity.

## Retained screen layers

`Screen` stays in its parent's flow. To cover retained content, wrap each
layer in `View row={0} col={0}` inside one full-bounds, single-cell `Grid`.
Put `Screen` inside the later wrapper; `Screen` itself has no row/col props.
Do not use flex-column siblings, `flex: 1`, or z-index as a substitute for
layer placement. See [the complete example and host prerequisites](../../../../docs/app/primitives.md#layer-a-screen-over-retained-content).

```tsx
import { Grid, Screen, Text, View } from '@octane-xplat/ui'
import './screen-layers.css'

export function RetainedLayers() {
	return <Grid rows="*" columns="*" className="screen-layers-host">
		<View row={0} col={0}><Text>Library</Text></View>
		<View row={0} col={0}>
			<Screen className="screen-layers-screen"><Text>Player</Text></Screen>
		</View>
	</Grid>
}
```

```css
/* screen-layers.css */
.screen-layers-host { width: 100%; height: 100%; }
.screen-layers-screen {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	flex: 1;
}
```

## Conventions

- `className` composes with each leaf's own `vx-*` class. Pass arrays directly
  to the JSX prop, for example `className={['vx-view', props.className]}`.
- `id` sets the element id — probes find views by it (`getViewById` on
  native, DOM id on web).
- Pan events normalize to `{x,y,dx,dy,vx,vy,state,target}` and swipe events
  to `{direction}`. Native pan velocity is wired on iOS through
  `velocityInView` and on Android through `VelocityTracker`; both report
  velocity in dips per second.
- `children` is a universal renderable; avoid over-typing it.
- Accessibility props map to ARIA/native attributes; see
  `docs/platform/platform-services.md` for the current mappings.

## What primitives deliberately don't do

No theming props (tokens + classes own that), no layout props beyond the
portable layout surface, and no state: components are controlled or
uncontrolled per prop, never both.
