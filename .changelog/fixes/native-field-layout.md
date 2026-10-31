### Lay out native fields as one unit

On iOS and Android — and on the new GTK target — field chrome fixes keep
labels, width, state, and editors together:

- CheckboxList, RadioList, SegmentedControl, CheckboxInput, Switch,
  NumberInput, PinInput, SearchInput, and Rating now apply `width` and
  `status` to the complete field instead of the control alone.
- Field labels focus their associated input. InputGroup forwards width,
  read-only, loading, and status to member controls.
- FormLayout keeps each editor and its text when direction or label
  position changes. TextArea releases old row limits when `autoGrow`,
  `maxRows`, or an explicit height changes, and changing a SearchInput's
  leading icon keeps the editor's text and focus.

```tsx
import { FormLayout, TextInput, Switch } from '@octane-xplat/ui'

export function Settings({ direction }) {
  return (
    <FormLayout direction={direction} style={{ gap: 16 }}>
      <TextInput label="Name" width={320} />
      <Switch label="Enabled" width={320} />
    </FormLayout>
  )
}
```
