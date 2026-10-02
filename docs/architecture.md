# How an Xplat app fits together

> Your screens use shared building blocks. Platform files handle the parts
> that need to work differently in a browser or on a phone.

## Keep the app coherent

Think of a packing-list app. Its screens decide what to show; its data
records which items are packed; a share action lets someone send the list.
Most of that code can work on web, iOS, and Android. The part that opens the
share picker may need different code on each platform.

Xplat gives those parts a common name so your screen can ask to share
without choosing a browser or phone implementation itself.
[Platform files](module-resolution.md) explain how that selection works.
Check [target support](spec.md#choose-your-targets) when adding a platform:
shared names do not mean every feature is available everywhere.

```tsx
import { share } from '@octane-xplat/share'
import { Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<Pressable onPress={() => share({ text: 'Packing list' })}>
			<Text>Share list</Text>
		</Pressable>
	)
}
```

## The three layers

You will usually work with these pieces:

| Piece                          | Its job                                            | Packing-list example                                           |
| ------------------------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| Screens and features           | Decide what the app shows and does.                | Show the items and the number left to pack.                    |
| Shared components and services | Provide reusable screen pieces and device actions. | `Text` shows the count; a share service sends the list.        |
| Platform implementations       | Connect those pieces to the browser or phone.      | Use the browser's sharing options or the phone's share picker. |

A **component** is a reusable piece of a screen. A **service** provides an
action or data without drawing a screen, such as saving a setting.
You import common components from `@octane-xplat/ui`; device services come
from `@octane-xplat/platform` or the [package for that feature](platform-services.md).

```tsx
import { View, Text, Pressable } from '@octane-xplat/ui'

export function Example() {
	return (
		<View>
			<Text>Packing list</Text>
			<Pressable onPress={() => console.log('Add item')}>
				<Text>Add item</Text>
			</Pressable>
		</View>
	)
}
```

Octane turns components into UI. NativeScript connects them to native views
and APIs on iOS and Android. Most app screens can use Xplat's components
without calling those underlying tools directly.

## Shared code and platform code

Start with shared code. Split out a platform file when a feature needs
browser or native APIs, or when you want a different layout or OS control.
For example:

```text
ShareButton.tsrx          native default
ShareButton.web.tsrx      browser implementation
ShareButton.mobile.tsrx   implementation shared by iOS and Android
```

The screen keeps one import:

```ts
```

The build selects the right file. Each version should accept the same
options and report the same actions so the rest of your app can keep using
it. The [file guide](module-resolution.md) lists the selection order.

### When a wrapper may pass through

A wrapper is a component that surrounds other screen content. Sometimes
its extra behavior is needed only on phones. `KeyboardAvoiding`, for
example, makes room for the software keyboard on iOS and Android. On web
and desktop it keeps the same column layout without that adjustment.

```tsx
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [name, setName] = useState('')
	return (
		<KeyboardAvoiding>
			<TextInput label="Name" value={name} onChange={setName} />
		</KeyboardAvoiding>
	)
}
```

That works because the content is still useful without the adjustment.
A missing camera preview cannot work the same way: removing the camera
removes the feature. Check a wrapper's documented behavior rather than
assuming it adds the same enhancement on every platform.

### Normalization classes

Some components have an appearance drawn by Xplat; others keep part or all
of the platform's own appearance. The docs call these **normalization
classes**. You mainly need these labels when reading
[known limits](known-limits.md).

**Chrome** means a control's visible decoration, such as borders and
buttons. **Parity** means matching across platforms. The table describes
the matching contract on supported targets. A difference inside that contract
is a bug; known limits record current gaps.

| Label                | Matching contract                                                                               | Examples                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `self-drawn`         | The whole appearance (every pixel) and behavior.                                                | `Switch`, `Tabs`, `SegmentedControl`, `Item` |
| `chrome-reset`       | The whole appearance (every pixel), while the OS control supplies editing behavior.             | `TextInput`, `TextArea`, `SearchInput`       |
| `hosted`             | The outer frame and any controls Xplat draws, while an OS or engine supplies the content.       | `Video`, `CameraView`, `WebView`             |
| `platform-authentic` | The OS's own control, with its own look and behavior. Matching other platforms is not the goal. | `UISwitch`, `MaterialDialog`                 |

For example, `WebView` frames a web page but does not make two browser
engines draw that page identically. An iOS `UISwitch` is available through
`@octane-xplat/ui/ios` and belongs in an iOS file, while the shared `Switch`
comes from `@octane-xplat/ui`.

```tsx
import { WebView } from '@octane-xplat/ui'

export function Example() {
	return <WebView src="https://example.com" />
}
```

If you are adding components to the framework, the
[architecture notes](architecture-notes.md#normalization-classes-how-a-shared-component-gets-classified)
explain how these labels are assigned and checked.

## What belongs in a screen

A screen decides what to show, what to save, and where to go next. It can
use shared components, state, and services.

Keep browser-specific objects such as `document`, NativeScript view names
such as `gridlayout`, and direct OS calls in platform files. That lets a
shared screen run without needing those objects on every platform.
[Building screens](primitives.md) shows the everyday components.

## Shared state

**State** is information that can change while someone uses the app: the
packing items, the current filter, or whether a dialog is open. Keep state
inside a component when only that component needs it. Use shared state when
several screens need the same information.

Octane's **signals** hold changing values and let the UI follow their
updates. For example, a `packedCount$` signal in a shared `.ts` file can be
read by both a header and a bottom sheet. Both see the same count in that
running app. This does not sync separate devices.

```ts
import { signal$ } from 'octane/signals'

// packing-state.ts: import this same signal in each reader.
export const packedCount$ = signal$(0)
```

For native reads to update the UI, keep signal names ending in `$` and
include a runtime import from `octane/signals` in every file that reads
them. If that file only receives a signal from elsewhere, add
`import 'octane/signals'`. Use `.get()` to read and `.set()` to write.
Reads while drawing a component subscribe to updates; reads in event
handlers or at file startup do not.

```tsx
import 'octane/signals'
import { packedCount$ } from './packing-state'
import { Text, Pressable } from '@octane-xplat/ui'

export function PackingCount() {
	return (
		<Pressable onPress={() => packedCount$.set(packedCount$.get() + 1)}>
			<Text>Packed: {packedCount$.get()}</Text>
		</Pressable>
	)
}
```

Plain mutable objects do not subscribe automatically on native. Code using
an existing store needs `useStore(store)` in each reading component. Prefer
signals for new shared state.

```tsx
import { createStore, useStore, Text } from '@octane-xplat/ui'

const count = createStore(0)
export function Count() {
	const value = useStore(count)
	return <Text>{value}</Text>
}
```

For server data, use a query and show loading and error content while it
runs. [Fetching data](data.md) covers queries, sharing, cancellation, and
retry. The [architecture notes](architecture-notes.md) cover compiler and
renderer details for framework contributors.
