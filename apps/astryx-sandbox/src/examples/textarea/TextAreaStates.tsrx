// Port of upstream TextArea/TextAreaStates.tsx (Astryx 0.6.4, MIT).
import { TextArea, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextAreaStates() @{
	const [requiredValue, setRequiredValue] = useState('')

	<Stack direction="vertical" gap={4} style={{ width: 400 }}>
		<TextArea
			label="Required field"
			value={requiredValue}
			onChange={setRequiredValue}
			placeholder="Describe the issue..."
			isRequired
		/>
		<TextArea
			label="Disabled field"
			value="This field is disabled and cannot be edited."
			onChange={() => {}}
			isDisabled
		/>
		<TextArea
			label="Loading field"
			value=""
			onChange={() => {}}
			placeholder="Generating summary..."
			isLoading
		/>
	</Stack>
}
