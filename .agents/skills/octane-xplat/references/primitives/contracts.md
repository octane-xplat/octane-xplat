# Shared primitive contracts

Read these constraints when choosing a component or porting DOM habits to shared UI. Return to the [component task index](../primitives.md) for a specific control.

## Shared surface

Use the [component guide](../../../../../docs/app/components.md) to choose a
component, and the public declarations/export map for exact names and props.
State and routing operations have dedicated `/data` and `/routing` entrypoints;
visual components stay at the root.

Check the [normalization contract](../../../../../docs/start/architecture.md#normalization-classes)
when deciding which appearance and behavior must match across targets.

`Switch`, `Slider`, `Spinner`, `Tabs`, and the color suite
(`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorSwatch`, `ColorField`) are
self-drawn shared components: their shared props produce the same component
design across targets, rather than exposing OS chrome. Color parts report
`'#rrggbb'` hex through `onChange`/`onChangeEnd`; `ColorSlider` is hue-only
and drags are delta-based like `Slider`. `ColorArea`/`ColorSlider` are Tab
stops on web and AppKit (Arrow 1°/1%, Shift 10×) and expose assistive
increment/decrement on iOS, Android and AppKit (hue 10°, brightness 5%);
AppKit keyboard/VoiceOver delivery is unqualified. `Slider` follows pan
deltas and does not jump to a tapped track position. On web it is a Tab stop:
Arrow keys change 1% of its range, and Home/End choose the bounds. Pair
`value` with `onValueChange` to display the change. `Drawer` lives in the optional `@octane-xplat/drawer` package and includes
edge opening and drag dismissal on mobile. Pair controlled `open` with
`onOpenChange`; web/desktop require explicit controls. Read the
[drawer guide](../../../../../docs/app/drawer.md) when adding or migrating one. `TextInput`, `TextArea`, and
`ScrollableArea` remain OS-backed with normalized chrome because text editing and
scroll behavior belong to the platform.

```tsx
import { useState } from 'octane'
import { Switch, Slider, Spinner, TextInput } from '@octane-xplat/ui'
import { Drawer } from '@octane-xplat/drawer'

export function Controls() {
	const [packed, setPacked] = useState(false)
	const [volume, setVolume] = useState(50)
	return (
		<>
			<Switch value={packed} onChange={setPacked} />
			<Slider value={volume} onValueChange={(next) => {
				if (typeof next === 'number') setVolume(next)
			}} />
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
  [Grid placement](../../../../../docs/app/primitives.md#grid-placement).
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

## What primitives deliberately don't do

No theming props (tokens + classes own that), no layout props beyond the
portable layout surface, and no state: components are controlled or
uncontrolled per prop, never both.

### Media and secondary row actions

Use the public `useImageMode(src, { region, threshold, fallback })` hook for
browser image luminance, and a nested `Theme` with an explicit mode for the
exercised MediaTheme light/dark contract. Keep the nearest registered theme so
root theme switching still flows through. Native image sampling is unavailable
and returns the supplied fallback. Do not report fallback as detection.

```tsx
import { Theme, Text, defineTheme, getRegisteredTheme, useThemeName, useImageMode } from '@octane-xplat/ui'

const mediaTheme = defineTheme({ name: 'media' })
export function Caption(props: { src: string }) {
  const theme = getRegisteredTheme(useThemeName()) ?? mediaTheme
  const mode = useImageMode(props.src, { fallback: 'dark' })
  return <Theme theme={theme} mode={mode ?? 'dark'}><Text>Photo caption</Text></Theme>
}
```

`useContainerReveal` exposes only `isEnabled` and the two default prop getters.
Spread container props on the row and content props on its secondary actions.
Web uses scoped CSS hover/focus-within. AppKit now has a capability-gated CSS
hover/focus-within source path: nested containers reset their inherited opacity,
actions keep layout space and remain mounted, and missing native tracking keeps
them visible. There is no transition or new hook-owned observer; the renderer
owns tracking and focus updates. Native hover/Tab/focus/AX/packed behavior requires separate verification. Touch/other native defaults remain visible; force/delay and inverted
reveal remain gaps.
See [the media guide](../../../../../docs/app/components.md#media-contrast-and-row-actions).

```tsx
import { Button, HStack, useContainerReveal } from '@octane-xplat/ui'

export function RowActions() {
  const reveal = useContainerReveal({ isEnabled: true })
  return <HStack {...reveal.getContainerProps()}><HStack {...reveal.getContentRevealProps()}><Button label="Edit" /></HStack></HStack>
}
```
