# Forms with validation

> Keep form values, show helpful errors, and save a form with TanStack Form and your existing Xplat controls.

Use this package in an existing Octane Xplat app when a form needs validation,
reset, or a save operation. It connects TanStack Form's framework-independent
engine to Octane. Your app still chooses the controls and owns persistence.

```sh
# Run in your app directory, after this package is published.
bun add @octane-xplat/form
```

The adapter is new in this source checkout; it needs its first npm package
bootstrap before registry installation is available. Repository workspaces can
declare it directly:

```json
{ "dependencies": { "@octane-xplat/form": "workspace:*" } }
```

## Make a small form

Put this component in `src/TripForm.tsrx` and render it from your app screen.
Leave the name empty and press Save to see an error. Enter a name, save again,
and the text below the button reports the accepted value. This example keeps
that result in memory; replace the save callback with your own persistence.

```tsx
import { useState } from 'octane'
import { Button, Field, FormLayout, Text, TextInput, VStack } from '@octane-xplat/ui'
import { useField, useForm, useFormStore } from '@octane-xplat/form'

export function TripForm() {
  const [saved, setSaved] = useState('No trip saved yet.')
  const form = useForm({
    defaultValues: { name: '' },
    onSubmit: ({ value }) => { setSaved(`Saved: ${value.name}`) },
  })
  const name = useField({
    form,
    name: 'name',
    validators: {
      onBlur: ({ value }) => value.trim() ? undefined : 'Enter a trip name.',
    },
  })
  const submitting = useFormStore(form.store, (state) => state.isSubmitting)
  const message = name.state.meta.errors.find((error) => typeof error === 'string')
  const submit = () => { void form.handleSubmit() }

  return (
    <VStack>
      <FormLayout>
        <Field label="Trip name" isRequired status={message ? { type: 'error', message } : undefined}>
          <TextInput value={name.state.value} onChange={name.handleChange}
            onBlur={name.handleBlur} onSubmit={submit} returnKeyType="done" />
        </Field>
      </FormLayout>
      <Button label="Save" isLoading={submitting} isDisabled={submitting} clickAction={submit} />
      <Button label="Reset" isDisabled={submitting} clickAction={() => form.reset()} />
      <Text>{saved}</Text>
    </VStack>
  )
}
```

## Share the form across fields

Each component reading a field calls `useField`. Components reading a form
summary call `useFormStore` themselves. This matters on native: a parent's
render does not refresh children whose props stayed the same. Select a primitive
or an existing object; returning a fresh object from the selector makes the
snapshot unstable.

```tsx
import { Text } from '@octane-xplat/ui'
import { useForm, useFormStore } from '@octane-xplat/form'

export function DirtySummary() {
  const form = useForm({ defaultValues: { name: '' } })
  const dirty = useFormStore(form.store, (state) => state.isDirty)
  return <Text>{dirty ? 'Unsaved changes' : 'No changes'}</Text>
}
```

Mount a field component conditionally to register and release it with the UI.
Removing the component unregisters that field and cancels its pending validation;
its value remains in the form. Reset or explicitly clear that value if hiding
the field should also discard it. The maintained [TripForm example](../../packages/form/examples/TripForm.tsrx)
shows a checkbox, an optional note, async validation, reset, and rejected saves.

```tsx
import { Button } from '@octane-xplat/ui'
import { useForm } from '@octane-xplat/form'

export function ClearHiddenNote() {
  const form = useForm({ defaultValues: { note: 'Bring a coat' } })
  return <Button label="Clear note" clickAction={() => form.setFieldValue('note', '')} />
}
```

## Validation and saving

Validation belongs in TanStack's `validators`; `isRequired` supplies the field's
visual and accessibility marker. The core also accepts Standard Schema validators.
Schema errors can be objects, so format their messages before passing them to
`Field.status`. See [TanStack validation](https://tanstack.com/form/latest/docs/framework/react/guides/validation)
for validation timing and schema contracts.

```ts
const requiredName = ({ value }: { value: string }) =>
  value.trim() ? undefined : 'Enter a trip name.'
const validators = { onBlur: requiredName }

function fieldErrorMessage(errors: readonly unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message
    }
  }
  return undefined
}
```

For a remote save, return the Promise from `onSubmit`, disable duplicate submit
and reset actions while it is pending, and show rejected saves. The maintained
example uses this pattern:

```ts
async function submit(save: () => Promise<void>, showError: (message: string) => void) {
  try {
    await save()
  } catch {
    showError('Could not save. Try again.')
  }
}
```

## Platform and lifecycle boundaries

The adapter uses the same hooks on web, iOS, Android, and experimental desktop
hosts; it contains no platform UI. It creates no browser `<form>`. Wire a button
and the input's Return action to `handleSubmit`; a web-specific component can
add HTML form semantics when needed. See [text entry](../app/text-entry.md) for
keyboard, focus, and composition behavior.

```tsx
import { Button } from '@octane-xplat/ui'
import { useForm } from '@octane-xplat/form'

export function SubmitAction() {
  const form = useForm({ defaultValues: { name: '' } })
  return <Button label="Save" clickAction={() => form.handleSubmit()} />
}
```

`useForm` owns one form until its `formId` changes. `useField` owns one field
until its `form` or `name` changes. Options update after each committed render;
subscriptions and mounted core instances release when their owners unmount.
A field hook skipped temporarily within the same component follows Octane's
hook-retention rules; use a conditional child component for conditional fields.

```tsx
import { Text } from '@octane-xplat/ui'
import { useForm } from '@octane-xplat/form'

export function AccountForm(props: { accountId: string }) {
  const form = useForm({ formId: props.accountId, defaultValues: { name: '' } })
  return <Text>{form.formId}</Text>
}
```

Web and experimental AppKit have lifecycle coverage through synthesized
handlers. iOS, Android, Linux, and Windows runtime qualification remains open.
Object-driver tests establish universal subscriptions and cleanup, not OS input,
keyboard composition, screen-reader behavior, or visual parity.
React-specific components, devtools UI, server transforms, and server-framework integrations are
outside this adapter. Focus invalid fields through the existing
[`TextInputHandle`](../app/text-entry.md#release-and-restore-focus).

[Generated API reference](https://octane-xplat.goddardai.org/api-form).
