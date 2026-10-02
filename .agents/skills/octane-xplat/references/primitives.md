# Primitives

Import the shared surface from `@octane-xplat/ui`. Shared components use
platform leaves behind the same import; platform-authentic widgets use the
conditional `@octane-xplat/ui/ios`, `/android`, or `/web` subpaths. Those
subpaths resolve only for their target, so keep imports in a matching
platform-suffixed file (or a native file guarded by the matching OS branch).

**Prop types live in `packages/ui/src/props.ts`** — the source for shared
component leaves and published declarations. Platform subpath widgets also
use these shared prop contracts where applicable.

## Shared surface

These names are exported from the root package on web and native, including
`KeyboardAvoiding` (native leaves own OS keyboard events; web
observes `visualViewport`, macOS is an inert column). This inventory follows the current
`index.web.ts` and unsuffixed native-default `index.ts` barrels.

| Area                 | Shared exports                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Layout               | `View` (`Column` alias), `Row`, `Grid`, `Stack`, `Absolute`, `Spacer`, `Screen`                                 |
| Text and media       | `Text`, `RichText`, `RichTextSpan`, `Heading`, `Image`, `Icon`, `Meter`, `ActivityIndicator`                    |
| Interaction          | `Pressable`, `Link`, `NavLink`, `Switch`, `Slider`, `Tabs`, `Drawer`                                            |
| Inputs and scrolling | `TextInput`, `TextArea`, `ScrollView`, `ScrollBox`, `SafeArea`; `KeyboardAvoiding` (web = visualViewport inset) |
| Overlays             | `Overlay`, `Popover`, `Sheet`, `openSheet`, `closeSheet`, `showToast`                                           |
| Styling and state    | `styled`, `useAnimation`, `useStore`, theme and color-scheme APIs                                               |

`Switch`, `Slider`, `ActivityIndicator`, `Tabs`, and `Drawer` are
self-drawn shared components: their shared props produce the same component
design across targets, rather than exposing OS chrome. `Slider` follows pan
deltas and does not jump to a tapped track position. `Drawer` has no edge-swipe
gesture on web; provide a visible toggle. `TextInput`, `TextArea`, and
`ScrollView` remain OS-backed with normalized chrome because text editing and
scroll behavior belong to the platform.

## Platform-authentic subpaths

The OS widget is the value of these exports. They are intentionally absent
from the shared root barrel.

| Import                     | Current exports                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@octane-xplat/ui/ios`     | `UISwitch`, `UISlider`, `UIActivityIndicatorView`, `UITableView`, `UITabBar`, `UIModal`, `openModal`, `SideDrawer`, `LiquidGlass`, `LiquidGlassContainer` |
| `@octane-xplat/ui/android` | `MaterialSwitch`, `SeekBar`, `CircularProgressIndicator`, `RecyclerView`, `BottomNavigationView`, `MaterialDialog`, `openModal`, `DrawerLayout`           |
| `@octane-xplat/ui/web`     | `Hoverable`, `Tooltip` (compat re-export — the shared root barrel carries them too)                                                                       |

These conditional exports include the platform-authentic names
`UISwitch`/`MaterialSwitch`, `UITableView`/`RecyclerView`,
`UITabBar`/`BottomNavigationView`, `UIModal`/`MaterialDialog`,
`SideDrawer`/`DrawerLayout`, and iOS `LiquidGlass`. Platform subpaths are
deliberate exits from the same-pixels shared contract; use a matching
`.ios`/`.android`/`.web` file or an explicit platform branch.

## Removed from the shared surface

- `List` and `Modal` have no shared root export. Use `ScrollView` with mapped
  children for a shared list, or `UITableView`/`RecyclerView` for native
  virtualization. Use shared `Sheet`/`Overlay` for in-window overlays, or
  `UIModal`/`MaterialDialog` for platform-authentic modal UI.
- `openModal`, `PlatformBadge`, and the shared `glass` container prop are not
  root exports. `openModal` is available only from the iOS and Android
  subpaths. `Hoverable` and `Tooltip` ARE shared root exports (decision #69):
  pointer platforms (web, macOS) mount the hint layer on hover; touch leaves
  render only the trigger/children — keep essential information out of
  `content`/`card`.

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
  `docs/platform-services.md` for the current mappings.

## What primitives deliberately don't do

No theming props (tokens + classes own that), no layout props beyond the
portable layout surface, and no state: components are controlled or
uncontrolled per prop, never both.
