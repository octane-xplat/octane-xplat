# Keep AppKit text actions owned by the current field

ID: appkit-text-ownership
Targets: macos
Related APIs: TextInput, TextArea, SearchInput, TextInputHandle, onChange, onSubmit, onClear

## Starting point

Ordinary name, message and search fields like Home and ComponentsDemo, with
controlled or uncontrolled text and parent updates during callbacks.

## Acceptance criteria

- AC1: Held edit/submit/clear callbacks read current props/inherited blocking and callback/return-key policy. Mounted-host and reentry guards reject retired/nested mutations. Rapid uncontrolled edits update current local text before render; controlled parents own display. isLoading remains descriptive.
- AC2: Report composing draft changes; suppress submit/clear while the NSTextView or NSTextField editor has marked text. Accepted clear captures onChange then onClear even across prop replacement/teardown; later UI/focus work requires current attachment, blocking and responder ownership.
- AC3: Deliver one stable live handle through ref replacement, preserve foreign blur, reject disabled/hidden native focus and become inert after teardown. Keep native editing/IME/caret/Return/clear/focus/AX/package evidence separate from source/fake dispatch and record deferred commands.

## Documentation

- AC1: [Guide](../../../docs/app/text-entry.md#keep-appkit-text-actions-owned-by-the-current-field), [target controls](../../../packages/ui/src/text-controls.macos.tsrx), ten [authored object-driver cases](../../../packages/ui/src/text-entry-ownership.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/text-entry-ownership.macos.tsrx), all unrun. Existing text-control cases remain relevant and unrun.
- AC2: The same source/cases cover direct/editor marked state, accepted callback order, parent correction/replacement/teardown and callback-driven focus. This does not add a public autofocus prop or establish IME/Return ordering.
- AC3: [Private native handle](../../../packages/ui/src/date-field-handle.macos.ts) is reused without behavior changes. [Target note](../parity/appkit-progress.md#appkit-plain-text-edit-ownership) records exact deferred checks and qualification limits.
