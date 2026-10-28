// Port of upstream FormLayout/FormLayoutShowcase.tsx (Astryx 0.6.4, MIT).
import { FormLayout, TextInput, TextArea, Selector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function FormLayoutShowcase() @{
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [role, setRole] = useState<string | null>(null)
	const [notes, setNotes] = useState('')

	<div style={{ width: 520 }}>
		<FormLayout>
			<TextInput
				label="Full name"
				isRequired
				value={name}
				onChange={setName}
				placeholder="Jane Doe"
			/>
			<TextInput
				label="Email"
				isRequired
				value={email}
				onChange={setEmail}
				placeholder="jane@company.com"
			/>
			<Selector
				label="Role"
				options={[
					{ value: 'eng', label: 'Engineer' },
					{ value: 'des', label: 'Designer' },
					{ value: 'pm', label: 'Product manager' },
				]}
				value={role}
				onValueChange={setRole}
				placeholder="Select role"
			/>
			<TextArea
				label="Notes"
				isOptional
				value={notes}
				onChange={setNotes}
				placeholder="Anything else…"
			/>
		</FormLayout>
	</div>
}
