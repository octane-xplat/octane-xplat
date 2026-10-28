// Port of upstream FormLayout/FormLayoutHorizontal.tsx (Astryx 0.6.4, MIT).
import { FormLayout, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function FormLayoutHorizontal() @{
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')

	<div style={{ width: 560 }}>
		<FormLayout direction="horizontal">
			<TextInput label="Name" value={name} onChange={setName} placeholder="Jane Doe" />
			<TextInput label="Email" value={email} onChange={setEmail} placeholder="jane@company.com" />
			<TextInput
				label="Phone"
				isOptional
				value={phone}
				onChange={setPhone}
				placeholder="(555) 000-0000"
			/>
		</FormLayout>
	</div>
}
