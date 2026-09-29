# Platform pickers

> Use a platform-specific selection control through an explicit package entry point.

`@octane-xplat/picker` groups related controls for distribution. It does not
provide one cross-platform picker component: SwiftUI `Picker`, a Compose
Material 3 dropdown, and browser `<select>` have different names and contracts.
This keeps platform behavior visible at the import and call site.

## Install and import

Add `@octane-xplat/picker` to the app that renders a control. Import the
platform-specific component from the matching target entry:

- `SwiftUIPicker` from `@octane-xplat/picker/ios` in `.ios.ts` or `.ios.tsrx`.
- `MaterialDropdown` from `@octane-xplat/picker/android` in `.android.ts` or `.android.tsrx`.
- `Select` from `@octane-xplat/picker/web` in `.web.ts` or `.web.tsrx`.

Each entry exports its own component and prop types. The package has no shared
runtime entry or shared `types` subpath. See the maintained target-specific
examples in [`packages/demos/src/`](../packages/demos/src/).

The platform entries install their framework adapters automatically. On iOS,
the adapter hosts a SwiftUI `Picker` using menu style. On Android, the adapter
hosts a Jetpack Compose Material 3 dropdown; it is a Compose Material control,
not an Android framework widget. NativeScript builds plugin Kotlin sources in
a separate AAR project, so Android apps must make the Compose compiler plugin
available in `App_Resources/Android/buildscript.gradle` and apply it to the
generated `picker` project from `before-plugins.gradle`. The demo harness
has this setup in [`buildscript.gradle`](../apps/mobile/App_Resources/Android/buildscript.gradle)
and [`before-plugins.gradle`](../apps/mobile/App_Resources/Android/before-plugins.gradle).
Match the compiler plugin version to the Kotlin Gradle plugin used by the
NativeScript plugin build. The web entry renders an HTML `<select>`.

## Platform APIs

The iOS entry exports `SwiftUIPicker`, `SwiftUIPickerOption`, and
`SwiftUIPickerProps`. Options use `id`, `title`, and optional `disabled`; the
selected ID is controlled with `selection` and `onSelectionChange`, or seeded
with `defaultSelection`.

The Android entry exports `MaterialDropdown`, `MaterialDropdownItem`, and
`MaterialDropdownProps`. Items use `key`, `text`, and optional `enabled`; the
selected key is controlled with `selectedKey` and `onSelectedKeyChange`, or
seeded with `defaultSelectedKey`. The whole control uses `enabled`.

The web entry exports `Select`, `SelectOption`, and `SelectProps`. It follows
the browser select model: options use `value`, `label`, and optional `disabled`;
controlled state uses `value` and `onChange`, and uncontrolled state uses
`defaultValue`.

All three APIs accept an optional visible `label`, `accessibilityLabel`,
`disabled` or `enabled` state as appropriate, and the host `id`, `className`,
and `style` props. These similarities do not imply a shared selection contract.

## Why a leaf package

The package groups related platform controls while keeping their APIs distinct.
Its native adapters stay outside `@octane-xplat/ui`, whose dependency and peer
surface remains plugin-free. **Keep the controls in this leaf; do not create
general `@octane-xplat/swift-ui` or `@octane-xplat/jetpack-compose` packages
yet.** One feature does not show that general bridge packages would remove
repeated work. Android also needs app-level Compose compiler configuration for
NativeScript's generated AAR build. Revisit the split when another real feature
needs the same bridge setup or an abstraction shared across leaf packages.
