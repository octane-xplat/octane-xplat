import { Field, KeyboardAvoiding, Text, TextInput } from '@octane-xplat/ui'
import { KeyboardProvider } from '@octane-xplat/keyboard'

/** The existing form wrapper follows native keyboard measurements when supported. */
export function KeyboardMotionDemo() @{
  // 1. Provide native keyboard measurements to the screen.
  <KeyboardProvider>
    {/* 2. Move the form clear of the keyboard with a small top offset. */}
    <KeyboardAvoiding keyboardVerticalOffset={8}>
      <Text>Keep the message above the phone keyboard.</Text>
      <Field label="Message">
        <TextInput placeholder="Write a message" />
      </Field>
    </KeyboardAvoiding>
  </KeyboardProvider>
}
