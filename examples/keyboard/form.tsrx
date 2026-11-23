import { useRef } from 'octane'
import { Button, Field, TextInput, TextArea, View } from '@octane-xplat/ui'
import { KeyboardAwareScrollView } from '@octane-xplat/keyboard'
import type { KeyboardScrollBinding } from '@octane-xplat/keyboard'

/** Clearance, extra range, and explicit visibility recheck are independent. */
export function KeyboardFormDemo() @{
  // 1. Keep the scroll binding so the screen can request a visibility check.
  const scrolling = useRef<KeyboardScrollBinding | null>(null)

  // 2. Wrap the fields in a keyboard-aware scroll view with extra clearance.
  <KeyboardAwareScrollView
    clearance={12}
    extraScrollSpace={40}
    ref={(binding) => {
      scrolling.current = binding
    }}
  >
    <View>
      <Field label="Name">
        <TextInput placeholder="Your name" />
      </Field>
      <Field label="Email">
        <TextInput placeholder="you@example.com" />
      </Field>
      <Field label="Message">
        <TextArea placeholder="Write a message" />
      </Field>
      {/* 3. Recheck the focused field when the user requests it. */}
      <Button onPress={() => scrolling.current?.recheck()}>Show editing field</Button>
    </View>
  </KeyboardAwareScrollView>
}
