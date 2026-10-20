# Primitives

Import the shared surface from `@octane-xplat/ui`. Shared components use
platform leaves behind the same import; platform-authentic widgets use the
conditional `@octane-xplat/ui/ios`, `/android`, or `/web` subpaths. Those
subpaths resolve only for their target, so keep imports in a matching
platform-suffixed file (or a native file guarded by the matching OS branch).

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

**Prop types live in `packages/ui/src/props.ts`** — the source for shared
component leaves and published declarations. Platform subpath widgets also
use these shared prop contracts where applicable.

## Shared surface

These names are exported from the root package on web and native, including
`KeyboardAvoiding` (native leaves own OS keyboard events; web
keeps the wrapper layout without keyboard avoidance, macOS is an inert column). This inventory follows the current
`index.web.ts` and unsuffixed native-default `index.ts` barrels.

```tsx
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'

export function Notes() {
	return (
		<KeyboardAvoiding>
			<TextInput label="Packing notes" />
		</KeyboardAvoiding>
	)
}
```

| Area                 | Shared exports                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Layout               | `View`, `VStack`, `HStack`, `Grid`, `Stack`, `Absolute`, `Spacer`, `Screen`                      |
| Text and media       | `Text`, `RichText`, `RichTextSpan`, `Heading`, `Image`, `Icon`, `Meter`, `Spinner`               |
| Interaction          | `Pressable`, `Link`, `NavLink`, `Switch`, `Slider`, `Tabs`, `Drawer`                             |
| Inputs and scrolling | `TextInput`, `TextArea`, `ScrollableArea`, `SafeArea`; `KeyboardAvoiding` (web = layout wrapper) |
| Overlays             | `Overlay`, `Popover`, `BottomSheet`, `openBottomSheet`, `closeBottomSheet`, `showToast`          |
| Styling and state    | `styled`, `useAnimation`, `useStore`, theme and color-scheme APIs                                |

`Switch`, `Slider`, `Spinner`, `Tabs`, and `Drawer` are
self-drawn shared components: their shared props produce the same component
design across targets, rather than exposing OS chrome. `Slider` follows pan
deltas and does not jump to a tapped track position. `Drawer` has no edge-swipe
gesture on web; provide a visible toggle. `TextInput`, `TextArea`, and
`ScrollableArea` remain OS-backed with normalized chrome because text editing and
scroll behavior belong to the platform.

```tsx
import { useState } from 'octane'
import { Drawer, Switch, Slider, Spinner, TextInput } from '@octane-xplat/ui'

export function Controls() {
	const [packed, setPacked] = useState(false)
	return (
		<>
			<Switch checked={packed} onCheckedChange={setPacked} />
			<Slider value={50} onValueChange={console.log} />
			<Spinner />
			<TextInput label="Bag name" />
			<Drawer open={false}>
				<TextInput label="Packing notes" />
			</Drawer>
		</>
	)
}
```

## Platform-authentic subpaths

The OS widget is the value of these exports. They are intentionally absent
from the shared root barrel.

| Import                     | Current exports                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@octane-xplat/ui/ios`     | `UISwitch`, `UISlider`, `UIActivityIndicatorView`, `UITableView`, `UITabBar`, `UIModal`, `openModal`, `SideDrawer`, `LiquidGlass`, `LiquidGlassContainer` |
| `@octane-xplat/ui/android` | `MaterialSwitch`, `SeekBar`, `CircularProgressIndicator`, `RecyclerView`, `BottomNavigationView`, `MaterialDialog`, `openModal`, `DrawerLayout`           |
| `@octane-xplat/ui/web`     | `HoverCard`, `Tooltip` (compat re-export — the shared root barrel carries them too)                                                                       |

These conditional exports include the platform-authentic names
`UISwitch`/`MaterialSwitch`, `UITableView`/`RecyclerView`,
`UITabBar`/`BottomNavigationView`, `UIModal`/`MaterialDialog`,
`SideDrawer`/`DrawerLayout`, and iOS `LiquidGlass`. Platform subpaths are
deliberate exits from the same-pixels shared contract; use a matching
`.ios`/`.android`/`.web` file or an explicit platform branch.

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
  and macOS. `null` is never an explicit neutral: pass `''`, `0`, or
  `false` when the documented default isn't the value you want.
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
  margins. Mason places inserted cells during layout; wait for that layout
  pass before measuring bounds. For bounded cells, use CSS zero-minimum
  tracks and omit the corresponding `rows`/`columns` prop so CSS owns that
  axis; see [Grid placement](../../../../docs/app/primitives.md#grid-placement).
- **Text controls report the new string.** `TextInput`'s `onChange` gets
  `value: string`, not an event; controlled `value` writes suppress their
  own echo. `useKeyboardInset()` returns the keyboard inset in dips — zero
  on web/desktop, and on Android it leases window resize, so don't also add
  it as padding there or you double-avoid.
- **Hosted surfaces normalize the frame, not the content.** `WebView`,
  `Video`, `CameraView` render engine-owned pixels — identical props,
  different engine behavior per target. Check `docs/verify/known-limits.md`
  before promising parity.

## Conventions

- `className` composes with each leaf's own `vx-*` class; use `cx()` for
  native class composition.
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
