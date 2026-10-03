/** @jsxImportSource @nativescript-community/octane */
import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { useSignal$ } from 'octane/signals/client'

export default function Counter() {
	const count$ = useSignal$(0)
	return <VStack className="maestro-screen">
		<Text>Maestro counter</Text>
		<Text>{'Count: ' + count$.get()}</Text>
		<Pressable className="maestro-increment" onPress={() => count$.set(count$.get() + 1)}>
			<Text>Increment</Text>
		</Pressable>
	</VStack>
}
