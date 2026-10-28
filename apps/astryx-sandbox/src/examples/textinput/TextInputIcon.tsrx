// Port of upstream TextInput/TextInputIcon.tsx (Astryx 0.6.4, MIT).
import { TextInput, Stack, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextInputIcon() @{
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	<div style={{ width: 300 }}>
		<Stack direction="vertical" gap={3}>
			<TextInput
				label="Full name"
				value={name}
				onChange={setName}
				placeholder="Sarah Chen"
				startIcon={<Icon name="sandbox-user" size={16} />}
			/>
			<TextInput
				keyboardType="email"
				label="Email"
				value={email}
				onChange={setEmail}
				placeholder="sarah@company.com"
				startIcon={<Icon name="sandbox-envelope" size={16} />}
			/>
			<TextInput
				secure
				label="Password"
				value={password}
				onChange={setPassword}
				placeholder="Enter your password"
				startIcon={<Icon name="sandbox-lock" size={16} />}
			/>
		</Stack>
	</div>
}
