# Native picker

> Use a native menu picker on iOS and Android with the same value contract and a browser select fallback.

`@octane-xplat/native-picker` is a pilot leaf for a single-selection picker. It
keeps native UI frameworks outside `@octane-xplat/ui`, whose dependency and
peer surface stays plugin-free.

## Install and import

Run `pnpm add @octane-xplat/native-picker` in the app that renders the picker. Import the
matching target entry from platform-suffixed control modules:

- `@octane-xplat/native-picker/ios` from `.ios.ts` or `.ios.tsrx`.
- `@octane-xplat/native-picker/android` from `.android.ts` or `.android.tsrx`.
- `@octane-xplat/native-picker/web` from `.web.ts` or `.web.tsrx`.

Import `NativePickerProps` and `NativePickerOption` from
`@octane-xplat/native-picker/types` in shared code. Keep the platform component
import in its matching leaf; the package intentionally has no shared runtime
entry. See the maintained usage in
[`NativePickerDemo.tsrx`](../packages/demos/src/NativePickerDemo.tsrx) and the
[iOS](../packages/demos/src/nativePickerControl.ios.ts),
[Android](../packages/demos/src/nativePickerControl.android.ts), and
[web](../packages/demos/src/nativePickerControl.web.ts) import leaves.

The platform entries install their framework adapters automatically. On iOS,
the adapter hosts a SwiftUI `Picker` using menu style. On Android, the adapter
hosts a Jetpack Compose Material dropdown; its NativeScript Gradle hooks enable
Compose dependencies and Material 3. NativeScript builds plugin Kotlin sources
in a separate AAR project, so Android apps must make the Compose compiler
plugin available in `App_Resources/Android/buildscript.gradle` and apply it to
the generated `native_picker` project from `before-plugins.gradle`. The demo
harness has this setup in
[`buildscript.gradle`](../apps/mobile/App_Resources/Android/buildscript.gradle)
and [`before-plugins.gradle`](../apps/mobile/App_Resources/Android/before-plugins.gradle).
Match the compiler plugin version to the Kotlin Gradle plugin used by the
NativeScript plugin build. The web entry renders an HTML `<select>`.

## Value and option contract

Each option has a unique string `value`, a display `label`, and optional
`disabled`. Pass `value` with `onValueChange` for controlled state, or use
`defaultValue` for an uncontrolled picker. Without either, the first option is
selected. `onValueChange` receives the selected string. `disabled` disables the
whole control; per-option `disabled` is respected on all three targets.

Pass a useful `label`; it is shown beside the native controls and provides the
default accessibility label. `accessibilityLabel` can override that value.
`id`, `className`, and `style` are accepted for shared caller ergonomics; browser
styling is target-specific, and native controls retain their platform rendering.

The pilot is intentionally limited to a menu/dropdown single selection. It does
not provide searchable lists, multiple selection, custom row content, or a
platform-independent presentation mode. The iOS and Android implementations
use different native bridges and require Xcode / CocoaPods and an Android build
with the Compose plugin respectively. This pilot does not establish a reusable
general-purpose SwiftUI or Compose component layer.

## Check selection

Mount the maintained poll-length demo. Its initial label should read
“Selected: 1 day (1440 minutes)”; choosing 7 days should show 10080 minutes.
Also check a disabled option and a disabled control in your app. Build each
target after adding its native configuration; a web selection alone does not
verify the SwiftUI or Compose bridge.

## Why a leaf package

The picker is a concrete app need and gives us a bounded way to exercise native
UI islands. Keeping the SwiftUI and Compose adapters in a leaf package lets
apps opt in without adding native framework dependencies to `@octane-xplat/ui`.

**Recommendation from this pilot: keep the native adapters in leaf packages;
do not create general `@octane-xplat/swift-ui` or
`@octane-xplat/jetpack-compose` packages yet.** One picker proves that both
bridges can serve a real app need, but it does not show that shared framework
packages would remove repeated work. Android also needs app-level Compose
compiler configuration for NativeScript's generated AAR build. Revisit the
package split when a second real feature needs the same bridge setup or a
reusable abstraction that belongs across leaf packages; compare the repeated
setup against the cost of maintaining those packages.
