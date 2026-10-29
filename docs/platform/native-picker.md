# Platform pickers

> Choose an option with an iOS picker, Android dropdown, browser select, or experimental native AppKit pop-up button.

For a shared selection field, start with [Selector](../app/search-selection.md#choose-from-a-finite-list).
Use `@octane-xplat/picker` when you want a platform's own control. Each version
has its own name and options, so keep it in a matching
[platform file](module-resolution.md).

```tsx
import { Selector } from '@octane-xplat/ui'

export function Example() {
	return (
		<Selector
			label="Region"
			options={[{ value: 'sfo', label: 'San Francisco' }]}
			defaultValue="sfo"
		/>
	)
}
```

## Install and import

Run `pnpm add @octane-xplat/picker` from your app folder. Import the
platform-specific component from the matching target entry:

- `SwiftUIPicker` from `@octane-xplat/picker/ios` in `.ios.ts` or `.ios.tsrx`.
- `MaterialDropdown` from `@octane-xplat/picker/android` in `.android.ts` or `.android.tsrx`.
- `Select` from `@octane-xplat/picker/web` in `.web.ts` or `.web.tsrx`.
- `AppKitPicker` from `@octane-xplat/picker/macos` in `.macos.tsx` or `.macos.tsrx` (experimental AppKit source implementation; native qualification pending).

Each entry exports its own component and prop types. The package has no shared
runtime entry or shared `types` subpath. See the maintained target-specific
examples in [`packages/demos/src/`](../../packages/demos/src/).

The platform imports install their framework adapters automatically. Use the
matching entry in each platform file:

```ts
// Picker.ios.ts
import { SwiftUIPicker } from '@octane-xplat/picker/ios'
```

```ts
// Picker.android.ts
import { MaterialDropdown } from '@octane-xplat/picker/android'
```

Android apps also need the Compose compiler plugin configured for the generated
`picker` project. Follow the maintained harness setup in
[`buildscript.gradle`](../../apps/mobile/App_Resources/Android/buildscript.gradle)
and [`before-plugins.gradle`](../../apps/mobile/App_Resources/Android/before-plugins.gradle),
matching the compiler plugin version to NativeScript's Kotlin Gradle plugin.

## Platform APIs

The iOS entry exports `SwiftUIPicker`, `SwiftUIPickerOption`, and
`SwiftUIPickerProps`. Options use `id`, `title`, and optional `disabled`; the
selected ID is controlled with `selection` and `onSelectionChange`, or seeded
with `defaultSelection`.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Region.ios.tsrx
import { SwiftUIPicker } from '@octane-xplat/picker/ios'

export function Region() {
	return (
		<SwiftUIPicker
			label="Region"
			options={[{ id: 'sfo', title: 'San Francisco' }]}
			defaultSelection="sfo"
			onSelectionChange={(id) => console.log(id)}
		/>
	)
}
```

The Android entry exports `MaterialDropdown`, `MaterialDropdownItem`, and
`MaterialDropdownProps`. Items use `key`, `text`, and optional `enabled`; the
selected key is controlled with `selectedKey` and `onSelectedKeyChange`, or
seeded with `defaultSelectedKey`. The whole control uses `enabled`.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Region.android.tsrx
import { MaterialDropdown } from '@octane-xplat/picker/android'

export function Region() {
	return (
		<MaterialDropdown
			label="Region"
			items={[{ key: 'sfo', text: 'San Francisco', enabled: true }]}
			defaultSelectedKey="sfo"
			enabled
			onSelectedKeyChange={(key) => console.log(key)}
		/>
	)
}
```

The web entry exports `Select`, `SelectOption`, and `SelectProps`. It follows
the browser select model: options use `value`, `label`, and optional `disabled`;
controlled state uses `value` and `onChange`, and uncontrolled state uses
`defaultValue`.

```tsx
// Region.web.tsrx
import { Select } from '@octane-xplat/picker/web'

export function Region() {
	return (
		<Select
			label="Region"
			options={[{ value: 'sfo', label: 'San Francisco' }]}
			defaultValue="sfo"
			onChange={(value) => console.log(value)}
		/>
	)
}
```

All four APIs require a visible `label` and accept `accessibilityLabel`,
`disabled` or `enabled` state as appropriate, and the host `id`, `className`,
and `style` props. These similarities do not imply a shared selection contract.

```tsx
// Region.web.tsrx; native files use their matching prop contracts.
import { Select } from '@octane-xplat/picker/web'

export function Region() {
	return (
		<Select
			id="region"
			className="region-picker"
			label="Region"
			accessibilityLabel="Region"
			disabled
			options={[{ value: 'sfo', label: 'San Francisco' }]}
		/>
	)
}
```

## Native macOS selection

Use `AppKitPicker` in a configured native AppKit app for a compact set of
choices. Its source embeds the system's noneditable pop-up button. Put this
component in a `.macos.tsx` file; each accepted choice updates the selected
string ID. The AppKit renderer installs the bridge, so this target needs no
SwiftUI or Compose adapter setup.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// BagPicker.macos.tsx
import { useState } from 'octane'
import { AppKitPicker } from '@octane-xplat/picker/macos'
import { Text, View } from '@octane-xplat/ui'
export function BagPicker() {
	const [selection, setSelection] = useState('carry')
	return <View className="gap-3">
		<AppKitPicker label="Bag" selection={selection} onSelectionChange={setSelection}
			options={[{ id: 'carry', title: 'Carry-on' }, { id: 'checked', title: 'Checked bag' }]} />
		<Text>{`Bag: ${selection}`}</Text>
	</View>
}
```

The macOS entry exports `AppKitPicker`, `AppKitPickerProps` and
`AppKitPickerOption`. IDs must be unique strings; repeated or empty titles and
the empty string ID are allowed. Use `defaultSelection` for uncontrolled state.
Later defaults do not reset the current record; reordering and renaming choices
preserve its selected ID. A disabled option can display a saved selection but
cannot produce a user change. Empty choices, or no enabled choices, disable
native selection.

```tsx
// Shipping.macos.tsx
import { AppKitPicker } from '@octane-xplat/picker/macos'
export function Shipping() {
	return <AppKitPicker label="Shipping" defaultSelection=""
		options={[
			{ id: '', title: 'Standard' },
			{ id: 'economy', title: 'Standard' },
			{ id: 'overnight', title: 'Overnight', disabled: true },
		]} onSelectionChange={(id) => console.log(id)} />
}
```

When choices arrive after an empty list, the uncontrolled seed or last accepted
ID is retained if it exists. Otherwise the first enabled ID is selected
silently. Removing a selected uncontrolled ID uses the same fallback, without a
change callback. For controlled state, an unmatched ID in a nonempty list is
invalid; no silent replacement is accepted. Duplicate IDs or invalid option
types also show a generic message. Repair the options or selection to recover.

```tsx
// AsyncRegion.macos.tsx
import { AppKitPicker, type AppKitPickerOption } from '@octane-xplat/picker/macos'
export function AsyncRegion({ choices }: { choices: readonly AppKitPickerOption[] }) {
	return <AppKitPicker label="Region" options={choices} defaultSelection="oslo" />
}
```

For a retained field that switches records, set `id` to the record key. A new id
retires the old native attachment and reseeds uncontrolled state. Replacing only
the native view retains the current ID. Callbacks use current props, and
programmatic writes, duplicate values, disabled choices, stale controls and
reentrant callbacks do not emit. `className` and `style` apply to the outer
label/control field; `accessibilityLabel` defaults to its visible label.

```tsx
// RecordBag.macos.tsx
import { AppKitPicker } from '@octane-xplat/picker/macos'
export function RecordBag({ recordID }: { recordID: string }) {
	return <AppKitPicker id={`bag-${recordID}`} label="Bag" className="gap-2"
		style={{ minWidth: 240 }} defaultSelection="carry"
		options={[{ id: 'carry', title: 'Carry-on' }, { id: 'checked', title: 'Checked bag' }]} />
}
```

The native implementation cancels its owned menu tracking before replacing
choices or removing the control. Actual pointer/keyboard selection, menu-loop
timers, Tab/focus behavior, disabled-option rendering, label announcements,
VoiceOver, layout, teardown and installed consumers remain unqualified. Source
and model cases do not prove those behaviors. The
[maintained demo](../../packages/demos/src/NativePickerDemo.macos.tsrx) includes
controlled rejection, asynchronous/empty choices, duplicate labels, invalid
IDs, in-place renaming, current callbacks, record replacement and remounting.
Its idle probe and consumer/type tests are authored but unrun.

## Why a leaf package

The package groups related platform controls while keeping their APIs distinct.
Its native adapters stay outside `@octane-xplat/ui`, whose dependency and peer
surface remains plugin-free. **Keep the controls in this leaf; do not create
general `@octane-xplat/swift-ui` or `@octane-xplat/jetpack-compose` packages
yet.** One feature does not show that general bridge packages would remove
repeated work. Android also needs app-level Compose compiler configuration for
NativeScript's generated AAR build. Revisit the split when another real feature
needs the same bridge setup or an abstraction shared across leaf packages.
