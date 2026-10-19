import { useState } from 'octane'
import { Button, Field, Text, TextInput, View } from '@octane-xplat/ui'
import { KeyboardStickyView } from '../src/index'

/** Sticky movement leaves the conversation's layout independent of the composer. */
export function KeyboardComposerDemo() @{
	const [draft, setDraft] = useState('')

	<View flexGrow={1}>
		<View flexGrow={1}>
			<Text>Conversation</Text>
		</View>
		<KeyboardStickyView openOffset={8}>
			<Field label="Message">
				<TextInput value={draft} onChange={setDraft} />
			</Field>
			<Button clickAction={() => setDraft('')}>Send</Button>
		</KeyboardStickyView>
	</View>
}
