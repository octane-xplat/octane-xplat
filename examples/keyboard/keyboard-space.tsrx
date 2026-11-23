import { useState } from 'octane'
import {
  Field,
  KeyboardAvoiding,
  Pressable,
  Text,
  TextInput,
  useKeyboardInset,
} from '@octane-xplat/ui'

export function KeyboardSpaceDemo() @{
  // 1. Enable keyboard tracking and read its current inset.
  const [enabled, setEnabled] = useState(true)
  const inset = useKeyboardInset({ enabled })

  // 2. Keep the form clear of the keyboard and let the user pause tracking.
  <KeyboardAvoiding enabled={enabled} keyboardVerticalOffset={8}>
    <Text>Keyboard space: {inset} dip</Text>
    <Pressable onPress={() => setEnabled(!enabled)}>
      <Text>{enabled ? 'Pause keyboard tracking' : 'Resume keyboard tracking'}</Text>
    </Pressable>
    <Field label="Message">
      <TextInput placeholder="Tap to open the keyboard" />
    </Field>
  </KeyboardAvoiding>
}
