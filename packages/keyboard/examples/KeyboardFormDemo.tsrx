import { useRef } from 'octane'
import { Button, Field, TextInput, TextArea, View } from '@octane-xplat/ui'
import { KeyboardAwareScrollView } from '../src/index'
import type { KeyboardScrollBinding } from '../src/index'

/** Clearance, extra range, and explicit visibility recheck are independent. */
export function KeyboardFormDemo() @{
	const scrolling = useRef<KeyboardScrollBinding | null>(null)

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
			<Button clickAction={() => scrolling.current?.recheck()}>Show editing field</Button>
		</View>
	</KeyboardAwareScrollView>
}
