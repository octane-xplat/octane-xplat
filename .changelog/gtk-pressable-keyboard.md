### Activate GTK press actions from the keyboard

GTK Pressables with a button role now accept Tab focus and activate on Return or
Space release. Link roles activate on Return. Disabled controls and cancelled
key presses do not activate.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'

export function SaveAction(props: { disabled: boolean; save: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Save" disabled={props.disabled} onPress={props.save}>
      <Text>Save</Text>
    </Pressable>
  )
}
```

[GTK keyboard actions](https://octane-xplat.goddardai.org/linux-gtk#keyboard-press-actions).
