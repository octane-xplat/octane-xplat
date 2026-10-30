# Keep AppKit text actions owned by the current field

ID: appkit-text-ownership
Targets: macos
Related APIs: TextInput, TextArea, SearchInput, TextInputHandle, NumberInput, onChange, onSubmit, onClear, onValueChange, min, max, step

## Starting point

Ordinary name, message and search fields like Home and ComponentsDemo, with
controlled or uncontrolled text and parent updates during callbacks.

## Acceptance criteria

- AC1: Held edit/submit/clear callbacks read current props/inherited blocking and callback/return-key policy. Mounted-host and reentry guards reject retired/nested mutations. Rapid uncontrolled edits update current local text before render; controlled parents own display. isLoading remains descriptive.
- AC2: Report composing draft changes; suppress submit/clear while the NSTextView or NSTextField editor has marked text. Accepted clear captures onChange then onClear even across prop replacement/teardown; later UI/focus work requires current attachment, blocking and responder ownership.
- AC3: Deliver one stable live handle through ref replacement, preserve foreign blur, reject disabled/hidden native focus and become inert after teardown. Keep native editing/IME/caret/Return/clear/focus/AX/package evidence separate from source/fake dispatch and record deferred commands.
- AC4: Own controlled composition intents, observer/task acquisition and writer-registry initialization/retirement across reentrant update/factory/read/marked/cleanup, late handles, failure and teardown. Retire both cleanup records before effects, capture native cleanup, preserve newer owners and suppress retired callbacks. Keep synchronous setter/read failures visible; retain later explicit retry with fixed deferred diagnostics and no native error/input payload. Prepare fourteen source cases and manual controlled/external/unset/removal trials while leaving real IME/selection/window-migration/undo/AX/memory/installed qualification open.

- AC5: Numeric edit/step/clear requests share current props, inherited blocking, attachment and reentry ownership. Rapid uncontrolled requests use current local intent; controlled null and the original local seed survive mode changes. Removed affordances reject held actions. Steps/clear wait during marked editor text while drafts retain existing parseFloat/clamp behavior. Accepted clear owns callback order across replacement/detach; errors release the claim without undoing accepted local intent. Keep source models separate from native field-editor, focus, input, accessibility and installed qualification.

## Documentation

- AC1: [Guide](../../../docs/app/text-entry.md#keep-appkit-text-actions-owned-by-the-current-field), [target controls](../../../packages/ui/src/components/forms/text-controls.macos.tsrx), ten [authored object-driver cases](../../../packages/ui/src/components/forms/text-entry-ownership.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/text-entry-ownership.macos.tsrx), all unrun. Existing text-control cases remain relevant and unrun.
- AC2: The same source/cases cover direct/editor marked state, accepted callback order, parent correction/replacement/teardown and callback-driven focus. This does not add a public autofocus prop or establish IME/Return ordering.
- AC3: [Private native handle](../../../packages/ui/src/components/forms/date-field-handle.macos.ts) is reused without behavior changes. [Target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-plain-text-edit-ownership) records exact deferred checks and qualification limits.
- AC4: [Pending-value guide](../../../docs/app/text-entry.md#keep-pending-appkit-values-with-their-field), [renderer contract](../../../packages/macos-renderer/README.md#own-pending-value-work), [writer](../../../packages/macos-renderer/src/text-value.ts), [fourteen authored cases](../../../packages/macos-renderer/test/text-value-ownership.test.ts), [existing adapter models](../../../packages/macos-renderer/test/text-value.test.ts), [manual fixture](../../../examples/probes/text-entry-ownership.macos.tsrx), [skill](../../skills/octane-xplat/references/primitives.md#controlled-appkit-text-during-composition) and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-controlled-composition-value-ownership). All cases/compiler/native/installed checks remain unrun.

- AC5: [Number guide](../../../docs/app/components.md#number-fields-on-appkit), [AppKit numeric leaf](../../../packages/ui/src/components/forms/InputNumber.macos.tsrx), eight new [authored object-driver cases](../../../packages/ui/src/components/forms/input-number.macos.mobile.test.tsrx) (thirteen total), [human-operated fixture](../../../examples/probes/number-input.macos.tsrx), [skill](../../skills/octane-xplat/references/primitives.md#appkit-number-fields) and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-numeric-current-request-ownership). Cases and fixture are unrun; the existing run hook checks initial metadata and direct toggle dispatch only.
