// Port of upstream Field/FieldRequired.tsx (Astryx 0.6.4, MIT).
import { TextInput, VStack, Center } from '@octane-xplat/ui'
import { useState } from 'octane'

export function FieldRequired() @{
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')

	<Center>
		<VStack gap={4}>
			<TextInput label="Username" isRequired value={username} onChange={setUsername} placeholder="Enter your username" />
			<TextInput label="Backup email" isOptional value={email} onChange={setEmail} placeholder="you@example.com" />
		</VStack>
	</Center>
}
