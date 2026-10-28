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
- AC3: [Field names](../../../docs/app/text-entry.md#control-a-field), [reusable rows](../../../docs/app/primitives.md#reusable-rows), and [Q15](../../design/open-questions.md).
- AC4: [Release and restore focus](../../../docs/app/text-entry.md#release-and-restore-focus), [native frame tracking](../../../docs/app/software-keyboard.md), [focused-input scrolling](../../../docs/app/software-keyboard.md#keep-the-editing-field-visible), [sticky composers](../../../docs/app/software-keyboard.md#keep-a-composer-beside-the-keyboard), the maintained [form example](../../../packages/keyboard/examples/KeyboardFormDemo.tsrx), and the maintained [motion example](../../../packages/keyboard/examples/KeyboardMotionDemo.tsrx).
- AC5: [Modal focus](../../../docs/app/text-entry.md#release-and-restore-focus), [retained exit lifecycle](../../../docs/app/animation-gestures.md#retain-content-through-exit), and [verification boundaries](../../../docs/app/text-entry.md#verification-boundaries).
- AC7: [Read software keyboard space](../../../docs/app/text-entry.md#read-software-keyboard-space), the maintained [keyboard-space example](../../../packages/ui/examples/KeyboardSpaceDemo.tsrx), [subscription tests](../../../packages/ui/tests/keyboard-inset.test.mjs), the [compiled cross-root hook test](../../../packages/ui/src/internal/keyboard/use-keyboard-inset.mobile.test.tsrx), and [packed consumers](../../../packages/ui/tests/packed-consumer.mjs).
- AC6: [Building screens: grouped fields](../../../docs/app/primitives.md#grouped-fields) and the maintained [ComponentsDemo](../../../packages/demos/src/ComponentsDemo.tsrx).
- AC8: [Component input contracts](../../../docs/app/components.md#inputs), [UI API migrations](../../../docs/app/ui-api-migrations.md#empty-values-and-time-domains), and the maintained [ComponentsDemo](../../../packages/demos/src/ComponentsDemo.tsrx).

## macOS verification

Run `bun run --filter @xplat/macos test:text-controls` for the maintained
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
delegate leaves marked-text confirmation to AppKit. [Component regressions](../../../packages/ui/src/components/forms/text-controls.macos.mobile.test.tsrx)
and [delegate regressions](../../../packages/macos-renderer/test/text-controls.test.ts)
provide source coverage only. Real keyboard, composition and full AC2 qualification
remain open; source dispatch is not evidence of physical input.


AppKit AC3 documentation now covers standalone TextInput/TextArea/SearchInput
field chrome and reuse of an enclosing Field; see [text and keyboard actions](../../../docs/app/primitives.md#text-and-keyboard-actions)
and the [object-driver field regressions](../../../packages/ui/src/components/forms/text-controls.macos.mobile.test.tsrx).
Default Field layout is a column and authored CSS strings are retained. These
are source/documentation claims only; actual layout, label interaction, keyboard
activation and VoiceOver require separate target qualification. Other native-control families and
SearchInput icon semantics are not qualified by these text-control repairs.


AppKit text-icon follow-up: TextInput.startIcon supports glyph names/rendered
nodes, and SearchInput supplies its default/custom icon or omits it for false.
TextInput forwards placeholderTextColor; SearchInput preserves omitted/empty
placeholders and marks its return action as search. Added object-driver
regression source; native icon pixels/spacing/accessibility are unqualified.
The controls leaf explicitly pins its pan import to AppKit for source/test
resolution; the AppKit bundler already prefers the macOS suffix. TextArea maxLength remains a source gap, separate
from these search/entry prerequisites.


## AppKit controlled composition follow-up

The [controlled-text guide](../../../docs/app/primitives.md#text-and-keyboard-actions)
now explains deferred values, latest-value supersession, matching echo cancellation,
unset/teardown and selection clamping. The renderer uses the live field editor
for textfields and the textview itself for multiline input. Raw NSSearchField's
separate text API is outside this source repair. [Writer/adapter regressions](../../../packages/macos-renderer/test/text-value.test.ts)
and the [manual native fixture](../../../examples/probes/controlled-text.macos.tsrx)
provide source coverage only.

For later real-keyboard qualification, open the maintained fixture and test both
fields with an input source that composes characters (for example Japanese):

1. Type and replace a middle selection; record native text, app value and caret.
2. Arm the five-second replacement and begin composition before it fires. Keep
   a candidate marked through the replacement; confirm its marked text survives
   while the app value changes to External N.
3. Confirm the candidate. Record the resulting native/app values: a newer
   onChange echo wins over the older pending external value. Repeat with more
   composing edits before confirmation to exercise cancellation.
4. Repeat while blurring, changing focus, hiding/removing the field and changing
   a controlled value. Check observer/work cancellation and undo/redo separately.

The fixture's automated run only records initial native strings. No real
keyboard/IME, selection, undo, native timing or packaged checks ran. AC1/AC2
runtime qualification remains open even though this manual procedure is now
covered in documentation.


## AppKit numeric fields

AC8's [AppKit guide](../../../docs/app/components.md#number-fields-on-appkit)
now covers declared unit/formatter/stepper/clear options and standalone/enclosing
Field ownership. Clear requests null before onClear; inherited disabled/read-only
state blocks steppers as well as editing. [Object-driver source cases](../../../packages/ui/src/components/forms/input-number.macos.mobile.test.tsrx)
cover null/default precedence, controlled requests, uncontrolled clamped stepping,
clear order, metadata ownership, unique IDs and stable editing-host identity.
The [maintained native fixture](../../../examples/probes/number-input.macos.tsrx)
records initial formatted text and a handler-driven option toggle only.

Use the explicit target mode for the component cases:

```sh
XPLAT_UI_TEST_TARGET=macos bun run turbo run test:native --filter=@octane-xplat/ui -- src/input-number.macos.mobile.test.tsrx
```

No test/probe has run in this slice. Actual formatted/partial/locale edits, IME,
layout, pointer/keyboard, focus, VoiceOver and packaged behavior remain open.
The formatter is display-only and does not introduce a locale-aware parser.


AppKit AC3 placeholder follow-up: TextArea now merges placeholderTextColor under
authored object/array/CSS-string styles; removing it releases that default while
an explicit authored placeholderColor remains. See [search and text examples](../../../docs/app/primitives.md#when-a-screen-needs-more)
and the existing [controlled-text fixture](../../../examples/probes/controlled-text.macos.tsrx),
which adds a manual color toggle. No test or probe ran; actual native placeholder
painting/theme/layout requires separate target qualification. This small leaf repair reuses existing
renderer style application/removal and adds no native selector or public API.
## GTK partial qualification

The full target list above is unchanged. The experimental GTK subset now
exports TextInput from the UI root; see [GTK text entry](../../../docs/platform/linux-gtk.md#text-entry).
The maintained [text-entry fixture](../../../packages/linux-gtk-renderer/test/fixtures/src/ui-text-entry.gtk.tsrx)
checks controlled writes/rejection, native cursor/selection, leading content,
focus/blur, submission and disposal with actual X11 input. The
[field fixture](../../../packages/linux-gtk-renderer/test/fixtures/src/ui-field-chrome.gtk.tsrx)
checks width, automatic labels/status, inherited sizing and keyboard clear/help.

These checks contribute to AC1 and the TextInput portions of AC3/AC4. They do
not establish the complete recipe: composition/marked text and multiline
Return (AC2), the public Field and group contracts (AC3/AC6), OSK/overlay
avoidance and keyboard insets (AC4/AC7), NumberInput (AC8), modal isolation and
Presence exit (AC5), and assistive-technology clients remain unqualified.
GTK coverage and exact-criterion verification are recorded separately in Silo's
gtk_recipe_checks; widget fixtures do not qualify packaged consumers.
