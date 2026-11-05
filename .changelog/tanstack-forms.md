### Validate and save forms with TanStack Form

`@octane-xplat/form` connects TanStack Form to Octane's component lifecycle and subscriptions. Keep typed values, validate fields, submit asynchronously, and reset forms while using the existing Xplat inputs.

```tsx
import { useField, useForm } from '@octane-xplat/form'
import { TextInput } from '@octane-xplat/ui'

export function TripName() {
  const form = useForm({ defaultValues: { name: '' } })
  const name = useField({ form, name: 'name' })
  return <TextInput label="Trip name" value={name.state.value} onChange={name.handleChange} onBlur={name.handleBlur} />
}
```

See [Forms with validation](https://octane-xplat.goddardai.org/package-form) for validation, submission, cleanup, and platform verification limits.
