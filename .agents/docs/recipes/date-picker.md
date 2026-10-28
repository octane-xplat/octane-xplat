# Add portable date and file inputs

ID: date-picker
Targets: web, ios, android, macos, linux
Related APIs: Calendar, DateInput, TimeInput, DateTimeInput, DateRangeInput, FileInput, @octane-xplat/files, @octane-xplat/date-picker

## Starting point

An Octane xplat app with `@octane-xplat/ui` and `@octane-xplat/files` installed. Add the optional
`@octane-xplat/date-picker` leaf only when the product needs SwiftUI, Material
3, or AppKit picker chrome instead of the shared picker surfaces.

## Requirements

Choose from a single date, time, combined date-time, date range, calendar, or
file workflow. Keep date values as portable ISO strings and use the file
picker bundled with `@octane-xplat/files`.

## Acceptance criteria

- AC1: Date controls are exported from `@octane-xplat/ui` and `FileInput` from `@octane-xplat/files`, with the same public prop names and types on every target.
- AC2: Date (`YYYY-MM-DD`), time (`HH:MM[:SS]`), and local date-time values (`YYYY-MM-DDTHH:mm[:ss]`) stay zone-free; instants include `Z` or an offset. Clear values are `null` across date, time, date-time, and range inputs; Calendar takes `null` for an explicitly empty selection. Date bounds and constraints apply on web and native surfaces, including range presets. Parent values remain authoritative after commits, resets, corrections, and rejected saves.
- AC3: `FileInput` supports `accept`, `isMultiple`, `maxSize`, `maxFiles`, clear/remove, and dropzone behavior where pointer drag/drop exists; its portable file reference and web `File` adaptation are documented.
- AC4: `FileInput` opens the browser, NativeScript, or AppKit picker by default; iOS and Android multi-file selection needs no app-owned adapter.
- AC5: Shared picker surface selection uses the `presentation` prop; apps that need OS-authentic controls can use the iOS, Android, or macOS leaf entry. The obsolete `nativePicker` flag and `@octane-xplat/date-picker/web` `DateInput` contract are removed in favor of `@octane-xplat/ui`.
- AC6: Maintained examples and focused tests/typechecks cover the shared API and native leaf boundary without visual inspection or device launch.

- AC7: Shared web date controls support enabled-cell keyboard focus, RTL calendar navigation, IME-safe text commits, and bounded time-option navigation. Apps can supply locale and translated state messages on all targets; unsupported native key/accessibility delivery is explicit.
- AC8: On experimental AppKit, read picked local files, write Documents files and export through a save panel; distinguish cancellation, unsupported hosts, size-limit/cancellation errors and write failures from a successful save. Security grants are session-scoped; no persistent bookmark is promised.

- AC9: AppKit FileInput owns one picker/save operation per mounted control, rejects immediate/reentrant duplicate edits, checks latest selection/constraints/blocking state before acceptance, ignores detached results/errors, reports sync/async failures, and removes by URI after reorder. Parent-owned selection is not rolled back on save failure; native drag/drop and actual panel/ref/focus qualification remain explicit evidence gates.

- AC10: Default AppKit FileInput picks receive finite filename MIME hints and best-effort Foundation size metadata before validation; supplied metadata is preserved, unknown/failed metadata stays optional and acquired metadata security scopes are released. Distinguish metadata hints from content verification/read limits and actual native evidence.

- AC11: AppKit FileInput input/dropzone presentations attach a current native destination lease for copy-delivered local file URLs, inspects regular-file references and reuses current picker/save validation and operation ownership. Preserve parent values, blocked/detached guards and other registered drag types; distinguish receipt from validation/save and keep promises/hover/autoscroll/grants/native qualification limits explicit.

- AC12: AppKit Calendar owns current native day refs and one enabled day Tab candidate across panes, adapts shared bounded/disabled/RTL navigation, manual activation and local range Escape, and preserves header/IME/modified/native Tab ownership. Controlled page focus waits for accepted cells; window changes, other navigation and teardown invalidate pending focus/claims. Keep adapter/fake-window evidence distinct from native key/focus/popup/AX qualification and native time-list gaps.

## Documentation

- AC1: [Portable component list](../../../docs/app/components.md#inputs) and [shared platform contract](../../../docs/platform/date-picker.md#portable-values).
- AC2: [ISO values and picker surfaces](../../../docs/platform/date-picker.md#portable-values), [UI API migrations](../../../docs/app/ui-api-migrations.md#empty-values-and-time-domains), and [maintained date example](../../../packages/demos/src/NativeDatePickerDemo.web.tsrx).
- AC3: [File reference and validation behavior](../../../docs/platform/date-picker.md#portable-values), the [maintained gallery example](../../../packages/demos/src/FileInputDemo.tsrx), the [web interaction tests](../../../packages/files/src/FileInput.web.test.tsx), and the [file validation tests](../../../packages/files/src/file-input-utils.ts).
- AC4: [Built-in picker defaults and host coverage](../../../docs/platform/date-picker.md#portable-values).
- AC5: [OS-authentic picker entries](../../../docs/platform/date-picker.md#os-authentic-pickers), [platform APIs](../../../docs/platform/date-picker.md#platform-apis), and [UI API migrations](../../../docs/app/ui-api-migrations.md#empty-values-and-time-domains).
- AC6: [web shared-control example](../../../packages/demos/src/NativeDatePickerDemo.web.tsrx), [iOS example](../../../packages/demos/src/NativeDatePickerDemo.ios.tsrx), [Android example](../../../packages/demos/src/NativeDatePickerDemo.android.tsrx), [macOS host note](../../../packages/demos/src/NativeDatePickerDemo.macos.tsrx), and targeted typegen/tests.

- AC7: [Keyboard and app language](../../../docs/platform/date-picker.md#keyboard-and-app-language), the [web demo](../../../packages/demos/src/NativeDatePickerDemo.web.tsrx), and [keyboard regressions](../../../packages/ui/src/date-entry.web.test.tsx).
- AC8: [Files read/write/export guide](../../../packages/files/README.md#binary-reads-writes-and-export) and [AppKit bridge regressions](../../../packages/files/src/files.macos.test.ts). Gap: bridge tests and actual AppKit picker/sandbox/packaged behavior have not been run; see [target progress](../parity/appkit-progress.md).

- AC9: [AppKit attachment lifetime](../../../packages/files/README.md#appkit-attachment-picker-lifetime), [portable file guide](../../../docs/platform/date-picker.md#portable-values), [authored controller cases](../../../packages/files/src/file-input-state.macos.test.ts) and [target note](../parity/appkit-progress.md#appkit-fileinput-operation-ownership). Cases remain unrun; native UI wiring is source-reviewed only.

- AC10: [AppKit metadata guide](../../../packages/files/README.md#appkit-file-metadata), default adapter source and [authored metadata/controller cases](../../../packages/files/src/file-input-details.macos.test.ts). Cases remain unrun; [target note](../parity/appkit-progress.md#appkit-fileinput-default-metadata) lists deferred native qualification.

- AC11: [Drop local files guide](../../../docs/platform/date-picker.md#drop-local-files-on-appkit), [files contract](../../../packages/files/README.md#appkit-local-file-drops), renderer contract, nine authored registry/bridge/inspection/controller cases, [maintained fixture](../../../examples/probes/fileinput-drop.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-local-file-drop-ownership). All cases/fixture and native qualification remain unrun.

- AC12: [AppKit calendar key guide](../../../docs/platform/date-picker.md#navigate-appkit-calendar-days-with-keys), six adapter/two object-driver wiring cases, [maintained fixture](../../../examples/probes/calendar-keys.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-calendar-day-keyboard-ownership). All eight cases and native qualification remain unrun.
