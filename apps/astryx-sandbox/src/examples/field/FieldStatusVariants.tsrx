// Port of upstream Field/FieldStatusVariants.tsx (Astryx 0.6.4, MIT).
import { TextInput, VStack, Center } from '@octane-xplat/ui'
import { useState } from 'octane'

export function FieldStatusVariants() @{
	const [email, setEmail] = useState('bad-email')
	const [username, setUsername] = useState('admin')
	const [apiKey, setApiKey] = useState('sk-live-abc123')

	<Center>
		<VStack gap={4}>
			<TextInput
				label="Email"
				description="Enter your work email"
				value={email}
				onChange={setEmail}
				status={{ type: 'error', message: 'Please enter a valid email address' }}
			/>
			<TextInput
				label="Username"
				description="Choose a unique username"
				value={username}
				onChange={setUsername}
				status={{ type: 'warning', message: 'This username is reserved for administrators' }}
			/>
			<TextInput
				label="API Key"
				description="Paste your API key"
				value={apiKey}
				onChange={setApiKey}
				status={{ type: 'success', message: 'API key is valid and active' }}
			/>
		</VStack>
	</Center>
}
