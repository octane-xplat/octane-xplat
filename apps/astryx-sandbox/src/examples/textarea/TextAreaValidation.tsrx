// Port of upstream TextArea/TextAreaValidation.tsx (Astryx 0.6.4, MIT).
import { TextArea, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextAreaValidation() @{
	const [errorValue, setErrorValue] = useState('Fix the')
	const [warningValue, setWarningValue] = useState('Summarize the Q2 results')
	const [successValue, setSuccessValue] = useState(
		'Redesign the onboarding flow to reduce drop-off by 15% in Q3. Focus on simplifying the account creation step and adding a progress indicator.',
	)

	const [errorNoMsgValue, setErrorNoMsgValue] = useState('Invalid content')

	<Stack direction="vertical" gap={4} style={{ width: 400 }}>
		<TextArea
			label="Error message"
			value={errorValue}
			onChange={setErrorValue}
			status={{ type: 'error', message: 'Description must be at least 20 characters.' }}
		/>
		<TextArea
			label="Warning message"
			value={warningValue}
			onChange={setWarningValue}
			status={{ type: 'warning', message: 'Consider adding more detail for clarity.' }}
		/>
		<TextArea
			label="Success message"
			value={successValue}
			onChange={setSuccessValue}
			status={{ type: 'success', message: 'Looks good — clear and actionable.' }}
		/>
		<TextArea
			label="Error without message"
			value={errorNoMsgValue}
			onChange={setErrorNoMsgValue}
			status={{ type: 'error' }}
		/>
	</Stack>
}
