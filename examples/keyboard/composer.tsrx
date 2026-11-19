import { useState } from 'octane'
import { Button, Field, Text, TextInput, View } from '@octane-xplat/ui'
import { KeyboardStickyView } from '@octane-xplat/keyboard'

/** Sticky movement leaves the conversation's layout independent of the composer. */
export function KeyboardComposerDemo() @{
  // 1. Keep the draft in the composer while the keyboard moves.
  const [draft, setDraft] = useState('')

  // 2. Leave the conversation flexible and place the composer in a sticky view.
  <View flexGrow={1}>
    <View flexGrow={1}>
      <Text>Conversation</Text>
    </View>
    <KeyboardStickyView openOffset={8}>
      <Field label="Message">
        <TextInput value={draft} onChange={setDraft} />
      </Field>
      {/* 3. Clear the draft after the example's Send action. */}
      <Button onPress={() => setDraft('')}>Send</Button>
    </KeyboardStickyView>
  </View>
}
