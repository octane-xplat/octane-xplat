### Focus native inputs from their field labels

Field labels now request focus for their associated input on iOS and Android.
GTK TextInput labels have the same behavior. Previously, the native label
was plain text with no activation handler. Disabled fields skip the action.

```tsx
import { TextInput } from '@octane-xplat/ui'

export function Account() {
	return <TextInput id="account" label="Account" defaultValue="" />
}
```

[Text fields and labels](https://octane-xplat.goddardai.org/app/text-entry#control-a-field)
