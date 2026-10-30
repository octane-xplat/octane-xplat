# Shared JSX type contract for Octane xplat

`@octane-xplat/jsx` is the type-only facade that owns the shared native JSX
contract: one intrinsic-element vocabulary for iOS, Android, and macOS.
NativeScript remains the iOS/Android driver and AppKit the macOS driver —
this package adds no third renderer, no runtime entry, and no startup side
effects. Every export is declarations only: the Octane compiler lowers JSX
before any `jsx()` factory could run, so these subpaths never execute.

The app creator configures this package. For an existing custom setup, add it
as a development dependency alongside the app's existing Octane dependency:

```sh
bun add -D @octane-xplat/jsx
```

## Select a JSX source

- Native files select the shared contract — `jsxImportSource` set to
  `@octane-xplat/jsx` in the target tsconfig, or
  `/** @jsxImportSource @octane-xplat/jsx */` as the first line of a file.
- Web files select DOM types explicitly with
  `/** @jsxImportSource @octane-xplat/jsx/dom */`.

## Export conditions

`./jsx-runtime` and `./jsx-dev-runtime` resolve the same shared contract on
every target; a `customConditions` setting binds the host element type:

| `customConditions`    | `HostElement` in refs and host events       |
| --------------------- | ------------------------------------------- |
| (none)                | `object` — any object-typed ref is accepted |
| `["native"]`          | NativeScript `View`                         |
| `["macos"]`           | bridged AppKit `NSView`                     |
| `["macos", "native"]` | AppKit `NSView` — `macos` wins              |

Under the default condition the shared `HostElement` is `object`: member
access on the handle fails, and the handle is not assignable to a concrete
platform view — name the concrete host type where the ref is declared. A
`.ios.tsrx` leaf can use the NativeScript `View` directly:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import type { View } from '@nativescript/core'

export function NativeLabel() {
	const labelRef = useRef<View | null>(null)
	return <label ref={labelRef} text="Trip details" />
}
```

Conditions change host element value types while preserving intrinsic
membership. The shared map carries the 39 NativeScript-baseline tags, the
compiler-produced `#text` node, and the nine maintained cross-platform
extension tags (`cachedimage`, `svgview`, `xplatvideo`, `nscanvas`,
`xplatlottie`, `pager`, `animatedimage`, `applesigninbutton`,
`googlesigninbutton`).

The `native` condition resolves `@nativescript/core` for the `View` ref type —
it is an optional peer; the default and `macos` declarations never reference
it. The `./dom*` subpaths re-export `octane`'s DOM JSX types, so `octane`
stays a required peer.

The AppKit label also declares accessibilityHeadingLevel for its native heading
metadata. Use 1–6 with accessibilityRole="heading"; application screens should
prefer ui's Heading level prop. This addition applies only under macos
conditions. Packed positive/range assertions are authored but unrun, and types
do not prove native heading behavior.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
const heading = <label accessibilityRole="heading" accessibilityHeadingLevel={2} text="Account" />
```

The AppKit textfield declares `placeholderTextColor`, a CSS color string for its
placeholder text. Application screens should prefer ui's TextInput
`placeholderTextColor` prop, which forwards to it. This addition applies only
under macos conditions.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
const search = <textfield placeholder="Search" placeholderTextColor="#8a8a8e" />
```

## Augmentation

The shared event vocabulary includes `onKeyDown`/`onKeyUp` and the normalized
`NativeKeyboardEvent` type. AppKit implements this attachment; declaration
presence does not imply another native driver's support. Apps should check
`useKeyboard().isSupported` and read the [keyboard guide](../../docs/app/keyboard-clipboard.md#handle-hardware-keys-on-appkit).

```ts
import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'

function handleKey(event: NativeKeyboardEvent<object>): void {
	if (event.key === 'Enter' && !event.isComposing) event.preventDefault()
}
```

Leaf packages that register elements augment `NativeElements` through
`@octane-xplat/jsx/intrinsics`:

```ts
declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		camerapreview: Attributes<TElement, { src?: string }>
	}
}
```

Platform-scoped registrations belong in platform-suffixed files so the added
membership only appears where the element exists.

For app configuration, follow [TypeScript and JSX setup](https://octane-xplat.goddardai.org/module-resolution#typescript).

The macOS condition adds `accessibilityOrientation` to `masonview` for native
named toolbar hosts. It describes the accessibility axis; it does not arrange
children or handle keys. UI Toolbar supplies it from its existing `orientation`
prop. Actual native accessibility behavior remains unqualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function NamedActions() {
	return <masonview accessibilityRole="toolbar" accessibilityLabel="Actions"
		accessibilityOrientation="horizontal" />
}
```
