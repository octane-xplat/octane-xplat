### Arrange labeled fields on GTK

GTK apps can import Field and FormLayout from the UI root. Arrange equal
columns or label-beside-control rows, inherit required/optional defaults, and
change direction without replacing existing editors.

```tsx
import { Field, FormLayout, TextInput } from '@octane-xplat/ui'

export function Name() {
  return (
    <FormLayout direction="horizontal" style={{ gap: 16 }}>
      <Field label="First name"><TextInput /></Field>
      <Field label="Last name"><TextInput /></Field>
    </FormLayout>
  )
}
```

GTK horizontal labels use separate rows per field rather than a shared label
column. [GTK setup](https://octane-xplat.goddardai.org/linux-gtk)
