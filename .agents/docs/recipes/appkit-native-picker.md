# Keep native AppKit picker choices owned by stable record and option IDs

ID: appkit-native-picker
Targets: macos
Related APIs: AppKitPicker, AppKitPickerOption, AppKitPickerProps

## Starting point

Settings and record forms need ordinary finite choices. The maintained native
picker demo was unsupported and the package lacked a macOS entry. The renderer
already allocated NSPopUpButton for raw index-based ListPicker; reuse that
control/action engine rather than add another native plugin. Keep that raw
index contract separate from the new platform-authentic ID API. Presence and
source models are not evidence of native input or package qualification.

## Requirements

Offer finite record choices through a native AppKit picker whose stable option
IDs, selection and actions stay owned by the current attachment.

## Acceptance criteria

- AC1: Add a macOS-only platform entry with AppKitPicker, AppKitPickerOption and AppKitPickerProps, standalone matching declarations and a typed packed-consumer lane in both Bundler/NodeNext modes. Preserve the empty root, use existing declared dependencies, and keep mobile adapters outside the AppKit import path. Authored consumers require separate execution evidence.
- AC2: Preserve uncontrolled IDs through reorder/rename, later defaults, async empty choices and view replacement; missing/removed IDs silently choose the first enabled option. Controlled state rejects unknown IDs in nonempty lists, restores rejected changes and retains the displayed ID when released. Snapshot unique string IDs/string titles, allow duplicate/empty titles and empty IDs, display disabled saved choices, and suppress invalid/disabled/unknown/duplicate/programmatic/stale/reentrant actions. Current callbacks and record-id replacement own cleanup/reseeding; recover from repaired data or native failure without exposing exception details.
- AC3: Share native control/action allocation with raw ListPicker; use explicit menu items and manual enablement, stable IDs and owned item identity. Equal choices preserve the menu, changed choices/teardown cancel tracking after retiring action epochs, unchanged selection/labels skip writes, native BOOL/window/superview/readiness guards reject unsafe input, and native setup/update/teardown failures release actions, items, constraints and target references. Raw index semantics stay separate; update the existing model extraction dependency.
- AC4: Replace the native demo placeholder with controlled acceptance/rejection, empty/invalid/duplicate/reordered/renamed choices, current callbacks, record changes, delayed replacement and remount. Reuse it in an idle probe. Author eight owner and seven actual renderer-branch cases. Reconcile README, public guide/types, skill, feature and target note, exact deferred commands and source-vs-runtime limits; leave qualification gates open and record coverage separately from verification.

## Documentation

- AC1–AC4: [Native selection guide](../../../docs/platform/native-picker.md#native-macos-selection), [README](../../../packages/picker/README.md#native-macos-picker), public type comments, Octane primitives reference, feature and [target note](../exploration.md#operational-evidence).
- AC1: [Packed consumer](../../../packages/picker/tests/packed-consumer.mjs); type-only lane does not compile the native component or prove native resolution.
- AC2: [Owner-model cases](../../../packages/picker/tests/picker-owner.macos.test.mjs).
- AC3: [Actual renderer-branch cases](../../../packages/macos-renderer/test/picker.test.ts) and [existing raw ListPicker model](../../../packages/macos-renderer/test/raw-list-picker.test.ts). Native fakes do not prove selector ABI, menu tracking, BOOL getters or layout.
- AC4: [Maintained demo](../../../packages/demos/src/NativePickerDemo.macos.tsrx) and [idle probe](../../../examples/probes/native-picker.macos.tsrx). Timed replacement begins only with an explicit user button action; no native operation starts automatically.
