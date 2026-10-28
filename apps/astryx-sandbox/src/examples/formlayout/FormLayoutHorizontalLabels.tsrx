// Port of upstream FormLayout/FormLayoutHorizontalLabels.tsx (Astryx 0.6.4, MIT).
import { FormLayout, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function FormLayoutHorizontalLabels() @{
	const [first, setFirst] = useState('')
	const [last, setLast] = useState('')
	const [username, setUsername] = useState('')

	<div style={{ width: 560 }}>
		<FormLayout direction="horizontal-labels">
			<TextInput
				label="First name"
				isRequired
				value={first}
				onChange={setFirst}
				placeholder="Jane"
			/>
			<TextInput label="Last name" isRequired value={last} onChange={setLast} placeholder="Doe" />
			<TextInput
				label="Username"
				description="3–20 characters, letters and numbers"
				value={username}
				onChange={setUsername}
				placeholder="janedoe"
			/>
		</FormLayout>
	</div>
}
