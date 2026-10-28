// Port of upstream Field/FieldShowcase.tsx (Astryx 0.6.4, MIT).
import { Field, TextInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function FieldShowcase() @{
	const [email, setEmail] = useState('')
	const status =
		email.length > 0 && !email.includes('@')
			? { type: 'error' as const, message: 'Enter a valid email address.' }
			: undefined

	<Stack direction="vertical" gap={3} style={{ width: 320 }}>
		<Field
			label="Email"
			inputID="field-email"
			description="We will never share your email."
			isRequired
			status={status}
		>
			<TextInput
				label="Email"
				isLabelHidden
				value={email}
				onChange={setEmail}
				placeholder="you@example.com"
			/>
		</Field>
	</Stack>
}
