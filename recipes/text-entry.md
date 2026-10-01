# Enter and submit text reliably

ID: text-entry
Targets: web, ios, android
Related APIs: Field, FormLayout, InputGroup, InputGroupText, TextInput, TextArea, SearchInput, TextInputHandle, KeyboardAvoiding, label, description, isDisabled, isReadOnly, isRequired, isOptional, size, status, isLoading, hasClear, onChange, onSubmit, Sheet, Overlay

## Starting point

An Octane Xplat app with stateful forms and web, iOS, and Android targets.

## Requirements

Enter text without controlled-write echoes or unexpected selection changes,
submit deliberately, label fields, and manage focus and software-keyboard
space through form and overlay lifecycles.

## Acceptance criteria

- AC1: Controlled field writes do not call onChange, real edits call it once, and typing/replacing a middle selection preserves the intended text and cursor.
- AC2: Composition confirmation does not submit prematurely, marked text survives controlled updates, and multiline Return/submission semantics are documented and exercised with real keyboards.
- AC3: Standalone controls have accessible names; `Field` renders and associates a visible label, optional description, and status message with its child control. Enabled actions support browser Tab/Enter/Space; `isDisabled` controls cannot activate and expose disabled state, `isReadOnly` controls stay non-editable, and busy fields report `isLoading` without disabling edits. VoiceOver/TalkBack behavior is verified separately from mappings.
- AC6: `InputGroup` provides one label/description/status for joined prefix or suffix content and its input; group size/disabled state reaches members, and the web group is named by its visible label.
- AC4: Focus and blur handles release/restore editing focus, and software-keyboard avoidance keeps the final field reachable, including overlays opened with the keyboard already visible.
- AC5: Modal focus cannot escape into background content; close/restoration and nested modal isolation are covered independently on each target. Exiting Presence content cannot accept input or remain in assistive navigation.

## Documentation

- AC1: [Control a field](../docs/text-entry.md#control-a-field) and [editing and submission](../docs/text-entry.md#preserve-editing-and-submit-deliberately).
- AC2: [Editing and submission](../docs/text-entry.md#preserve-editing-and-submit-deliberately) and [verification boundaries](../docs/text-entry.md#verification-boundaries).
- AC3: [Field names](../docs/text-entry.md#control-a-field), [reusable rows](../docs/primitives.md#reusable-rows), and [Q15](../docs/open-questions.md#later--finer).
- AC4: [Release and restore focus](../docs/text-entry.md#release-and-restore-focus).
- AC5: [Modal focus](../docs/text-entry.md#release-and-restore-focus), [retained exit lifecycle](../docs/animation-gestures.md#retain-content-through-exit), and [verification boundaries](../docs/text-entry.md#verification-boundaries).
- AC6: [Building screens: grouped fields](../docs/primitives.md#grouped-fields) and the maintained [ComponentsDemo](../packages/demos/src/ComponentsDemo.tsrx).
