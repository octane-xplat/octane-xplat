/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it } from 'vitest'
import { useState } from 'octane'
import { Text, TextInput, View } from '@octane-xplat/ui'
import {
	type TextInputView,
	enterText,
	findByTestId,
	mountXplat,
	viewText,
	waitUntil,
} from '@octane-xplat/platform/testing'

// Controlled input — typed text flows up through onChange and back down as
// the rendered value; a parent write lands on the native field.
function EchoForm() @{
	const [value, setValue] = useState('')

	<View>
		<TextInput
			testID="echo.field"
			value={value}
			onChange={setValue}
			placeholder="type here"
		/>
		<Text>{'echo: ' + value}</Text>
	</View>
}

function SeededInput(props: { initial: string }) @{
	const [value, setValue] = useState(props.initial)

	<TextInput testID="seeded.field" value={value} onChange={setValue} />
}

describe('controlled text input', () => {
	it('round-trips typed text through onChange', async () => {
		const { view } = await mountXplat(EchoForm)
		const field = findByTestId<TextInputView>(view, 'echo.field')
		expect(field?.isLoaded, 'TextInput resolves to a loaded native field').toBe(true)

		await enterText(field!, 'hello xplat')
		await waitUntil(() => viewText(view).includes('echo: hello xplat'), {
			message: 'textChange did not reach the controlled onChange',
		})
	})

	it('applies the parent-owned value to the native field', async () => {
		const { view } = await mountXplat(SeededInput, { initial: 'preset' })
		const field = findByTestId<TextInputView>(view, 'seeded.field')
		expect(field?.text, 'imperative controlled write reaches the native field').toBe('preset')
	})
})
