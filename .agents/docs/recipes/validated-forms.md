# Validate and save a shared form

ID: validated-forms
Targets: web, ios, android, macos
Related APIs: useForm, useField, useFormStore, FormApi, FieldApi, Field, TextInput, CheckboxInput, FormLayout

## Starting point

An existing Octane Xplat app with the optional `@octane-xplat/form` package.

## Requirements

Connect typed form state to existing controls, show validation messages, save
valid values, reset edits, and release conditional fields without stale readers.

## Acceptance criteria

- AC1: A reader can initialize typed values, connect text and boolean controls, and keep independently rendered fields subscribed on web and native.
- AC2: Field validation on blur and debounced async changes updates the displayed error; invalid submission is blocked. Schema error objects are formatted explicitly for Field.status.
- AC3: A valid submission receives current values, pending state blocks duplicate app submit/reset actions, rejected saves are visible, and reset restores defaults.
- AC4: Conditional field components register on mount and release subscriptions, registrations and pending validation on removal; value retention and explicit clearing are explained.

## Documentation

- AC1: [First form and subscriptions](../../../docs/packages/package-form.md#make-a-small-form), [shared fields](../../../docs/packages/package-form.md#share-the-form-across-fields), and the [maintained example](../../../packages/form/examples/TripForm.tsrx).
- AC2: [Validation and saving](../../../docs/packages/package-form.md#validation-and-saving), the [maintained example](../../../packages/form/examples/TripForm.tsrx), and [adapter regressions](../../../packages/form/src/adapter.web.test.tsrx).
- AC3: [First form](../../../docs/packages/package-form.md#make-a-small-form), [save failures](../../../docs/packages/package-form.md#validation-and-saving), and the [maintained example](../../../packages/form/examples/TripForm.tsrx).
- AC4: [Field ownership](../../../docs/packages/package-form.md#share-the-form-across-fields), [lifecycle boundaries](../../../docs/packages/package-form.md#platform-and-lifecycle-boundaries), and [universal regressions](../../../packages/form/src/adapter.mobile.test.tsrx).

## Verification boundaries

The [lifecycle fixture](../../../packages/form/tests/fixtures/lifecycle.tsrx) runs
through the repository probe runner on web/iOS/Android/macOS. Handler dispatch
checks values, blur validation, blocked/valid submits, reset and conditional
release; it does not qualify physical keyboard input, composition, accessibility
or visual parity. Object-driver tests cover native retention without qualifying
an OS. Keep coverage and actual target execution separate in Silo.
