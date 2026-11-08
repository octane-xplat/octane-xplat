import { useField, useForm, useFormStore } from '../src/index'

// This file is checked, not executed. Regressions in nested-key, value, schema
// and validator inference must fail the package typecheck.
export function TypedForm(): void {
  const form = useForm({
    defaultValues: { profile: { name: '' }, enabled: false },
    onSubmit: ({ value }) => {
      value.profile.name.toUpperCase()
    },
  })

  const name = useField({
    form,
    name: 'profile.name',
    validators: { onBlur: ({ value }) => (value.length ? undefined : 'Required') },
  })

  const text: string = name.state.value
  const dirty: boolean = useFormStore(form.store, (state) => state.isDirty)

  name.handleChange('Ada')
  // @ts-expect-error a string field cannot receive a boolean
  name.handleChange(true)
  // @ts-expect-error unknown nested field paths are rejected
  useField({ form, name: 'profile.missing' })
  // @ts-expect-error form-level writes preserve each field's value type
  form.setFieldValue('enabled', 'yes')
  void text
  void dirty
}
