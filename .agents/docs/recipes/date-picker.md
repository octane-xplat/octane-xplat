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

- AC10: Default AppKit FileInput picks receive native filename MIME hints with finite fallbacks and best-effort Foundation size metadata before validation; preserve supplied metadata and requested concrete aliases only for known extensions or matching native type identity. Unknown/failed metadata stays optional, missing MIME can fail accept validation, and acquired metadata security scopes are released. Distinguish panel conformance from current field validation, metadata hints from content verification/read limits, and authored cases from actual native evidence.

- AC11: AppKit FileInput input/dropzone presentations attach a current native destination lease for copy-delivered local file URLs, inspects regular-file references and reuses current picker/save validation and operation ownership. Preserve parent values, blocked/detached guards and other registered drag types; distinguish receipt from validation/save and keep promises/hover/autoscroll/grants/native qualification limits explicit.

- AC12: AppKit Calendar owns current native day refs and one enabled day Tab candidate across panes, adapts shared bounded/disabled/RTL navigation, manual activation and local range Escape, and preserves header/IME/modified/native Tab ownership. Controlled page focus waits for accepted cells; window changes, other navigation and teardown invalidate pending focus/claims. Keep adapter/fake-window evidence distinct from native key/focus/popup/AX qualification and native time-list gaps.

- AC13: AppKit typed DateInput, TimeInput and both DateTimeInput segments connect native submit to their existing composition-aware blur commit boundary, preserving parse/bounds/null-clear and controlled values. Keep source wiring separate from native Return/blur/IME/draft/focus/AX qualification and remaining time stepping/preset-list keyboard gaps.

- AC14: AppKit DateTimeInput opens presets from current time-field Alt+Down and owns bounded native option focus/manual selection without committing on navigation. Current options/bounds/blocking and reentrant guards precede selection; Tab uses field-neighbor return intent and Escape stays with the layer. Repair changed options and release ref/window/Tab ownership. Keep policy/wiring evidence separate from native focus/IME/popup/AX/package qualification and explicit row text-relay/standalone stepping gaps.

- AC15: AppKit TimeInput adapts plain current-field Up/Down to shared minute increment/seconds/midnight and min/max policies, preserving parent authority and modified/composing/native editing. Current blocking, callback reentry and pending save ownership exclude duplicate edits; detach avoids settlement UI writes. Distinguish authored object-driver evidence from native key/repeat/field-editor/IME/draft/focus/AX qualification and DateTimeInput stepping/live-announcement gaps.

- AC16: AppKit DateTimeInput closed-field arrows adapt timeIncrement independently of preset cadence, with optional seconds, same-date midnight wrap, endpoint bounds, parent authority and date-less time drafts. Preserve open-popup/modified/composing ownership and current reentry/pending-save/detach guards. Distinguish source/object-driver evidence from native input, save/focus/AX and package qualification.

- AC17: AppKit DateInput/DateRangeInput claim before validation/application callbacks, reject reentrant/pending/blocked/detached changes and validate current date/range constraints. Picker selection requires open ownership; preset activation resolves the current keyed range. Accepted saves retain callback ownership through teardown and release on failure without detached state writes or parent rollback. Keep source/object-driver evidence separate from native save/editor/focus/layer/AX qualification.

- AC18: AppKit files.pick/pickMultiple resolve the complete extension/MIME union before presenting: native image/audio/video/text families, all registered concrete MIME alternatives and known concrete fallbacks. Any-type entries override mixed restrictions and clear reused panel filters; unresolved/malformed restrictions reject explicitly instead of silently broadening/narrowing. Load only UniformTypeIdentifiers before lazy UTType access, preserve cancellation and starting folders, and use modern arrays only for complete resolution. Reconcile guides/skill/feature note and eighteen authored cases with an extended human-operated fixture; leave native loading/filtering/metadata, sandbox/ref/drag/focus/AX/installed/visual evidence pending.

## Documentation

- AC1: [Portable component list](../../../docs/app/components.md#inputs) and [shared platform contract](../../../docs/platform/date-picker.md#portable-values).
- AC2: [ISO values and picker surfaces](../../../docs/platform/date-picker.md#portable-values), [UI API migrations](../../../docs/app/ui-api-migrations.md#empty-values-and-time-domains), and [maintained date example](../../../packages/demos/src/NativeDatePickerDemo.web.tsrx).
- AC3: [File reference and validation behavior](../../../docs/platform/date-picker.md#portable-values), the [maintained gallery example](../../../packages/demos/src/FileInputDemo.tsrx), the [web interaction tests](../../../packages/files/src/FileInput.web.test.tsx), and the [file validation tests](../../../packages/files/src/file-input-utils.ts).
- AC4: [Built-in picker defaults and host coverage](../../../docs/platform/date-picker.md#portable-values).
- AC5: [OS-authentic picker entries](../../../docs/platform/date-picker.md#os-authentic-pickers), [platform APIs](../../../docs/platform/date-picker.md#platform-apis), and [UI API migrations](../../../docs/app/ui-api-migrations.md#empty-values-and-time-domains).
- AC6: [web shared-control example](../../../packages/demos/src/NativeDatePickerDemo.web.tsrx), [iOS example](../../../packages/demos/src/NativeDatePickerDemo.ios.tsrx), [Android example](../../../packages/demos/src/NativeDatePickerDemo.android.tsrx), [macOS host note](../../../packages/demos/src/NativeDatePickerDemo.macos.tsrx), and targeted typegen/tests. AppKit ref additions have [date focus guidance](../../../docs/platform/date-picker.md#focus-an-appkit-date-field-from-a-form-action), three policy/six object-driver cases and a maintained date-focus fixture, all unrun.

- AC7: [Keyboard and app language](../../../docs/platform/date-picker.md#keyboard-and-app-language), the [web demo](../../../packages/demos/src/NativeDatePickerDemo.web.tsrx), and [keyboard regressions](../../../packages/ui/src/components/forms/date-entry.web.test.tsx).
- AC8: [Files read/write/export guide](../../../packages/files/README.md#binary-reads-writes-and-export) and [AppKit bridge regressions](../../../packages/files/src/files.macos.test.ts). Gap: bridge tests and actual AppKit picker/sandbox/packaged behavior have not been run; see [target progress](../parity/appkit-progress.md).

- AC9: [AppKit attachment lifetime](../../../packages/files/README.md#appkit-attachment-picker-lifetime), [portable file guide](../../../docs/platform/date-picker.md#portable-values), [authored controller cases](../../../packages/files/src/file-input-state.macos.test.ts) and [target note](../parity/appkit-progress.md#appkit-fileinput-operation-ownership). Cases remain unrun; native UI wiring is source-reviewed only.

- AC10: [AppKit metadata guide](../../../packages/files/README.md#appkit-file-metadata), [default adapter](../../../packages/files/src/file-input-details.macos.ts) and [nine authored metadata/controller cases](../../../packages/files/src/file-input-details.macos.test.ts). All remain unrun; the [current target note](../parity/appkit-progress.md#appkit-native-file-type-filters-and-mime-hints) supersedes the historical finite-only hint limitation and lists deferred native qualification.

- AC11: [Drop local files guide](../../../docs/platform/date-picker.md#drop-local-files-on-appkit), [files contract](../../../packages/files/README.md#appkit-local-file-drops), renderer contract, nine authored registry/bridge/inspection/controller cases, [maintained fixture](../../../examples/probes/fileinput-drop.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-local-file-drop-ownership). All cases/fixture and native qualification remain unrun.

- AC12: [AppKit calendar key guide](../../../docs/platform/date-picker.md#navigate-appkit-calendar-days-with-keys), six adapter/two object-driver wiring cases, [maintained fixture](../../../examples/probes/calendar-keys.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-calendar-day-keyboard-ownership). All eight cases and native qualification remain unrun.

- AC13: [Typed Return guide](../../../docs/platform/date-picker.md#commit-typed-appkit-date-and-time-drafts-with-return), [maintained fixture](../../../examples/probes/date-submit.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-typed-date-time-submit-wiring). Direct handler wiring received source/syntax review; fixture and native qualification remain unrun.

- AC14: [AppKit preset-time guide](../../../docs/platform/date-picker.md#choose-appkit-preset-times-with-keys), one renderer/four focus-policy/five object-driver cases, [maintained fixture](../../../examples/probes/preset-times.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-preset-time-option-keyboard-ownership). All ten cases and native checks remain unrun.

- AC15: [AppKit time stepping guide](../../../docs/platform/date-picker.md#step-appkit-time-values-with-arrow-keys), five object-driver cases, [maintained fixture](../../../examples/probes/time-step.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-timeinput-minute-key-stepping). Cases, fixture and native qualification remain unrun.

- AC16: [AppKit date-time stepping guide](../../../docs/platform/date-picker.md#step-the-appkit-date-time-field-without-opening-presets), four added DateTimeInput object-driver cases, [extended maintained fixture](../../../examples/probes/preset-times.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-datetimeinput-closed-field-stepping). Cases/fixture/native qualification remain unrun.

- AC17: [AppKit date save guide](../../../docs/platform/date-picker.md#keep-appkit-date-saves-owned-by-one-edit), seven object-driver cases, [maintained fixture](../../../examples/probes/date-save.macos.tsrx), skill reference and [target note](../parity/appkit-progress.md#appkit-date-and-range-save-ownership). Cases/fixture/package/native checks remain unrun.

- AC18: [Filter workflow](../../../docs/platform/date-picker.md#choose-file-types-on-appkit), [files contract](../../../packages/files/README.md#appkit-file-type-filters), [native filter/loader](../../../packages/files/src/file-pick-filter.macos.ts), [ten helper cases](../../../packages/files/src/file-pick-filter.macos.test.ts), [four added panel cases](../../../packages/files/src/files.macos.test.ts), [four added metadata/controller cases](../../../packages/files/src/file-input-details.macos.test.ts), [idle fixture](../../../examples/probes/fileinput-drop.macos.tsrx), [skill](../../skills/octane-xplat/references/primitives.md#appkit-file-type-filters-and-mime-hints), [feature note](../../../.changelog/appkit-file-type-filters.md) and [target note](../parity/appkit-progress.md#appkit-native-file-type-filters-and-mime-hints). All authored cases and compiler/native/installed/visual qualification remain UNRUN.
