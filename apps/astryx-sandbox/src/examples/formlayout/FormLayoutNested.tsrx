// Port of upstream FormLayout/FormLayoutNested.tsx (Astryx 0.6.4, MIT).
import { FormLayout, FieldGroup, TextInput, Switch } from '@octane-xplat/ui'
import { useState } from 'octane'

export function FormLayoutNested() @{
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [digest, setDigest] = useState(false)
	const [newsletter, setNewsletter] = useState(true)

	<div style={{ width: 520 }}>
		<FormLayout>
			<FieldGroup label="Contact information">
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
				<TextInput
					label="Phone"
					isOptional
					value={phone}
					onChange={setPhone}
					placeholder="(555) 000-0000"
				/>
			</FieldGroup>
			<FieldGroup label="Preferences">
				<Switch
					label="Weekly digest"
					value={digest}
					onChange={setDigest}
					labelPosition="start"
					labelSpacing="spread"
				/>
				<Switch
					label="Newsletter"
					value={newsletter}
					onChange={setNewsletter}
					labelPosition="start"
					labelSpacing="spread"
				/>
			</FieldGroup>
		</FormLayout>
	</div>
}
