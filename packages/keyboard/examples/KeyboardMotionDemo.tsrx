import { Field, KeyboardAvoiding, Text, TextInput } from '@octane-xplat/ui'
import { KeyboardProvider } from '../src/index'

/** The existing form wrapper follows native keyboard measurements when supported. */
export function KeyboardMotionDemo() @{
	<KeyboardProvider>
		<KeyboardAvoiding keyboardVerticalOffset={8}>
			<Text>Keep the message above the phone keyboard.</Text>
			<Field label="Message">
				<TextInput placeholder="Write a message" />
			</Field>
		</KeyboardAvoiding>
	</KeyboardProvider>
}
