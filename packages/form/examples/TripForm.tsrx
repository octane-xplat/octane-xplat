import { useState } from 'octane'
import { Button, CheckboxInput, Field, FormLayout, Text, TextInput, VStack } from '@octane-xplat/ui'
import { useField, useForm, useFormStore } from '../src/index'

function useTripForm(
  save: (value: { name: string; reminders: boolean; note: string }) => Promise<void>,
) {
  return useForm({
    defaultValues: { name: '', reminders: false, note: '' },
    onSubmit: async ({ value }) => {
      await save(value)
    },
  })
}

type TripFormApi = ReturnType<typeof useTripForm>

function TripName(props: { form: TripFormApi; submit: () => void }) @{
  const field = useField({
    form: props.form,
    name: 'name',
    validators: {
      onBlur: ({ value }) => (value.trim() ? undefined : 'Enter a trip name.'),
      onChangeAsyncDebounceMs: 150,
      onChangeAsync: async ({ value }) =>
        value.toLowerCase() === 'reserved' ? 'Choose another name.' : undefined,
    },
  })

  const message = field.state.meta.errors.find((error) => typeof error === 'string')

  <Field label="Trip name" isRequired status={message ? { type: 'error', message } : undefined}>
    <TextInput
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isLoading={field.state.meta.isValidating}
      onSubmit={props.submit}
      returnKeyType="done"
    />
  </Field>
}

function TripNote(props: { form: TripFormApi }) @{
  const field = useField({ form: props.form, name: 'note' })

  <TextInput
    label="Note"
    value={field.state.value}
    onChange={field.handleChange}
    onBlur={field.handleBlur}
  />
}

/** Save is supplied by the app; the example also reports rejected saves visibly. */
export function TripForm(props: {
  save: (value: { name: string; reminders: boolean; note: string }) => Promise<void>
}) @{
  const [result, setResult] = useState('')
  const form = useTripForm(async (value) => {
    await props.save(value)
    setResult('Trip saved.')
  })

  const reminders = useField({ form, name: 'reminders' })
  const [showNote, setShowNote] = useState(false)
  const submitting = useFormStore(form.store, (state) => state.isSubmitting)
  const submit = () => {
    setResult('')
    void form.handleSubmit().catch(() => setResult('Could not save. Try again.'))
  }

  <VStack>
    <FormLayout>
      <TripName form={form} submit={submit} />
      <CheckboxInput
        label="Trip reminders"
        value={reminders.state.value}
        onChange={reminders.handleChange}
      />
      @if (showNote) {
        <TripNote form={form} />
      }
    </FormLayout>
    <Button label={showNote ? 'Hide note' : 'Add note'} onPress={() => setShowNote(!showNote)} />
    <Button label="Save trip" isLoading={submitting} isDisabled={submitting} onPress={submit} />
    <Button
      label="Reset"
      isDisabled={submitting}
      onPress={() => {
        form.reset()
        setResult('')
      }}
    />
    <Text>{result}</Text>
  </VStack>
}
