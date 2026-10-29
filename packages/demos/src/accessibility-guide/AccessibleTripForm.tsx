import { useRef, useState } from 'octane'
import { Button, Text, TextInput, VStack, useAnnounce } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

/** Small local form: its accepted name is in memory, not a persisted save. */
export function AccessibleTripForm() {
	const [name, setName] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [status, setStatus] = useState('Choose a trip name.')
	const input = useRef<TextInputHandle | null>(null)
	const announce = useAnnounce()
	function submit() {
		const next = name.trim()
		if (!next) {
			setError('Enter a trip name before continuing.')
			setStatus('Trip name needs attention.')
			input.current?.focus()
			announce('Enter a trip name before continuing.', 'assertive')
			return
		}
		setError(null)
		setStatus(`Trip name selected: ${next}.`)
		announce('Trip name selected.')
	}
	function clear() {
		setName('')
		setError(null)
		setStatus('Trip name cleared.')
		input.current?.focus()
		announce('Trip name cleared.')
	}
	return (
		<VStack className="accessible-trip-form">
			<Text>Plan your trip</Text>
			<TextInput
				label="Trip name"
				description="For example, Kyoto weekend. Required."
				isRequired
				value={name}
				onChange={(value) => {
					setName(value)
					setError(null)
					setStatus('Ready to use this trip name.')
				}}
				status={error ? { type: 'error', message: error } : undefined}
				returnKeyType="done"
				onSubmit={submit}
				ref={(handle) => {
					input.current = handle
				}}
			/>
			<Button label="Use trip name" clickAction={submit} />
			<Button
				label="Clear trip name"
				isIconOnly
				icon={<Text>×</Text>}
				isDisabled={name.length === 0}
				clickAction={clear}
			/>
			<Text>{status}</Text>
		</VStack>
	)
}
