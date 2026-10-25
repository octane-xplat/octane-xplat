// Port of upstream Field/FieldWithDescription.tsx (Astryx 0.6.4, MIT).
import { TextInput, VStack, Center } from '@octane-xplat/ui'
import { useState } from 'octane'

export function FieldWithDescription() @{
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	<Center>
		<VStack gap={4}>
			<TextInput label="Email" description="We'll send a confirmation link to this address" value={email} onChange={setEmail} placeholder="you@example.com" />
			<TextInput label="Password" description="At least 8 characters with one uppercase letter" value={password} onChange={setPassword} placeholder="Create a password" />
		</VStack>
	</Center>
}
