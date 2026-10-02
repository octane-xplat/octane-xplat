# Platform pickers

> Choose an option with an iOS picker, Android dropdown, or browser select.

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
/** @jsxImportSource @nativescript-community/octane */
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
/** @jsxImportSource @nativescript-community/octane */
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

All three APIs require a visible `label` and accept `accessibilityLabel`,
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

## Why a leaf package

The package groups related platform controls while keeping their APIs distinct.
Its native adapters stay outside `@octane-xplat/ui`, whose dependency and peer
surface remains plugin-free. **Keep the controls in this leaf; do not create
general `@octane-xplat/swift-ui` or `@octane-xplat/jetpack-compose` packages
yet.** One feature does not show that general bridge packages would remove
repeated work. Android also needs app-level Compose compiler configuration for
NativeScript's generated AAR build. Revisit the split when another real feature
needs the same bridge setup or an abstraction shared across leaf packages.
