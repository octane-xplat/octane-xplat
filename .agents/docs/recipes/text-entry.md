# Enter and submit text reliably

ID: text-entry
Targets: web, ios, android, macos
Related APIs: Field, FormLayout, InputGroup, InputGroupText, TextInput, TextArea, SearchInput, NumberInput, TextInputHandle, KeyboardAvoiding, useKeyboardInset, KeyboardProvider, KeyboardController, FocusedInputController, KeyboardAwareScrollView, KeyboardScrollController, KeyboardStickyView, label, description, isDisabled, isReadOnly, isRequired, isOptional, size, status, isLoading, hasClear, onChange, onValueChange, onSubmit, Sheet, Overlay

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
- AC6: `InputGroup` provides one label/description/status for joined prefix or suffix content and its input; group size is a default that an explicit child size overrides, disabled state reaches members, and the web group is named by its visible label.
- AC4: Focus and blur handles release/restore editing focus, and software-keyboard avoidance keeps the final field reachable, including overlays opened with the keyboard already visible. Avoidance measures the actual host, consumes safe-area and ancestor space once, preserves the extra-offset meaning, and adds no duplicate compensation when native layout already resized.
- AC7: A reader can consume a numeric keyboard inset with documented units and platform scope, avoid double-padding an Android resized window, follow foreground Activity changes without remounting, and understand multiple-reader cleanup, resize restoration, and actual-host verification limits.
- AC8: `NumberInput` uses `null` as the explicit empty value and reports `null` on clear; omitted values retain uncontrolled behavior.
- AC5: Modal focus cannot escape into background content; close/restoration and nested modal isolation are covered independently on each target. Exiting Presence content cannot accept input or remain in assistive navigation.

## Documentation

- AC1: [Control a field](../../../docs/app/text-entry.md#control-a-field) and [editing and submission](../../../docs/app/text-entry.md#preserve-editing-and-submit-deliberately).
- AC2: [Editing and submission](../../../docs/app/text-entry.md#preserve-editing-and-submit-deliberately) and [verification boundaries](../../../docs/app/text-entry.md#verification-boundaries).
- AC3: [Field names](../../../docs/app/text-entry.md#control-a-field), [reusable rows](../../../docs/app/primitives.md#reusable-rows), and [Q15](../../design/open-questions.md#later--finer).
- AC4: [Release and restore focus](../../../docs/app/text-entry.md#release-and-restore-focus), [native frame tracking](../../../docs/app/software-keyboard.md), [focused-input scrolling](../../../docs/app/software-keyboard.md#keep-the-editing-field-visible), [sticky composers](../../../docs/app/software-keyboard.md#keep-a-composer-beside-the-keyboard), the maintained [form example](../../../packages/keyboard/examples/KeyboardFormDemo.tsrx), and the maintained [motion example](../../../packages/keyboard/examples/KeyboardMotionDemo.tsrx).
- AC5: [Modal focus](../../../docs/app/text-entry.md#release-and-restore-focus), [retained exit lifecycle](../../../docs/app/animation-gestures.md#retain-content-through-exit), and [verification boundaries](../../../docs/app/text-entry.md#verification-boundaries).
- AC7: [Read software keyboard space](../../../docs/app/text-entry.md#read-software-keyboard-space), the maintained [keyboard-space example](../../../packages/ui/examples/KeyboardSpaceDemo.tsrx), [subscription tests](../../../packages/ui/tests/keyboard-inset.test.mjs), the [compiled cross-root hook test](../../../packages/ui/src/use-keyboard-inset.mobile.test.tsrx), and [packed consumers](../../../packages/ui/tests/packed-consumer.mjs).
- AC6: [Building screens: grouped fields](../../../docs/app/primitives.md#grouped-fields) and the maintained [ComponentsDemo](../../../packages/demos/src/ComponentsDemo.tsrx).
- AC8: [Component input contracts](../../../docs/app/components.md#inputs), [UI API migrations](../../../docs/app/ui-api-migrations.md#empty-values-and-time-domains), and the maintained [ComponentsDemo](../../../packages/demos/src/ComponentsDemo.tsrx).

## macOS verification

Run `pnpm --filter @xplat/macos test:text-controls` for the maintained
[AppKit fixture](../../../apps/macos/test/text-controls-fixture.macos.tsx). It checks
text-control handles and responder callbacks, secure-mode updates while focused,
and submit dispatch distinct from text changes. Multiline action Return uses
`done`/`send`; other Return actions remain newlines. The fixture dispatches
commands directly, so it does not qualify real keyboards, composition,
assistive navigation, or the complete modal and form criteria.

The maintained [OS-input journey](../../../packages/keyboard/tests/fixtures/os-input.ios.tsrx)
and its Android counterpart exercise touch, typing, observed selection, sticky
clearance, and shared-sheet editing/focus return. See [qualification and commands](../keyboard.md#final-workflow-qualification).
This narrow journey does not establish the composition, controlled middle-edit,
physical-keyboard, or accessibility criteria above.


AppKit source follow-up: the shared TextArea leaf now forwards `onSubmit` for
`done`/`send`, suppresses blocked edit/submit callbacks, and the native multiline
delegate leaves marked-text confirmation to AppKit. [Component regressions](../../../packages/ui/src/text-controls.macos.mobile.test.tsrx)
and [delegate regressions](../../../packages/macos-renderer/test/text-controls.test.ts)
are authored but unrun. Real keyboard, composition and full AC2 qualification
remain open; source dispatch is not evidence of physical input.


AppKit AC3 documentation now covers standalone TextInput/TextArea/SearchInput
field chrome and reuse of an enclosing Field; see [text and keyboard actions](../../../docs/app/primitives.md#text-and-keyboard-actions)
and the [object-driver field regressions](../../../packages/ui/src/text-controls.macos.mobile.test.tsrx).
Default Field layout is a column and authored CSS strings are retained. These
are source/documentation claims only; actual layout, label interaction, keyboard
activation and VoiceOver remain unqualified. Other native-control families and
SearchInput icon semantics are not qualified by these text-control repairs.
