// Port of upstream CheckboxInput/CheckboxInputStatusVariations.tsx (Astryx 0.6.4, MIT).
import { CheckboxInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function CheckboxInputStatusVariations() @{
	const [error, setError] = useState<boolean | 'indeterminate'>(false)
	const [warning, setWarning] = useState<boolean | 'indeterminate'>(true)
	const [success, setSuccess] = useState<boolean | 'indeterminate'>(true)

	<Stack direction="vertical" gap={4}>
		<CheckboxInput
			label="Error"
			description="Required field that has not been accepted."
			value={error}
			onChange={setError}
			status={{ type: 'error', message: 'You must accept the terms to continue' }}
		/>
		<CheckboxInput
			label="Warning"
			description="Enabled setting with a side effect to be aware of."
			value={warning}
			onChange={setWarning}
			status={{ type: 'warning', message: 'This data may be shared with partners' }}
		/>
		<CheckboxInput
			label="Success"
			description="Confirmed setting that has been verified."
			value={success}
			onChange={setSuccess}
			status={{ type: 'success', message: 'Your email has been verified' }}
		/>
	</Stack>
}
