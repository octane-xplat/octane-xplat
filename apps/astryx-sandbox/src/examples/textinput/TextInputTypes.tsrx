// Port of upstream TextInput/TextInputTypes.tsx (Astryx 0.6.4, MIT).
// `type="password"` → secure; `type="email"` → keyboardType (Octane mapping).
import { TextInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextInputTypes() @{
	const [password, setPassword] = useState('hunter42')
	const [email, setEmail] = useState('sarah@example.com')
	const [tooltip, setTooltip] = useState('')
	const [required, setRequired] = useState('')
	const [optional, setOptional] = useState('')
	const [described, setDescribed] = useState('')

	<div style={{ width: 300 }}>
		<Stack direction="vertical" gap={3}>
			<TextInput
				label="Default field"
				value={described}
				onChange={setDescribed}
				placeholder="Enter your email"
				description="Descriptions can be used to provide additional information about a field."
			/>
			<TextInput
				secure
				label="Password field"
				value={password}
				onChange={setPassword}
				placeholder="Enter a value"
			/>
			<TextInput
				keyboardType="email"
				label="Email field"
				value={email}
				onChange={setEmail}
				placeholder="Enter a value"
			/>
			<TextInput
				label="Field tooltip"
				value={tooltip}
				onChange={setTooltip}
				placeholder="Enter your API key"
				labelTooltip="Your unique API key for authentication. Keep this secret!"
			/>
			<TextInput
				label="Required field"
				value={required}
				onChange={setRequired}
				placeholder="Enter your username"
				isRequired
			/>
			<TextInput
				label="Optional field"
				value={optional}
				onChange={setOptional}
				placeholder="Enter your nickname"
				isOptional
			/>
		</Stack>
	</div>
}
