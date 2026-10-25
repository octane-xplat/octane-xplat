// Port of upstream TimeInput/TimeInputStates.tsx (Astryx 0.6.4, MIT).
import { TimeInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISOTimeString } from '@octane-xplat/ui'

export function TimeInputStates() @{
	const [required, setRequired] = useState<ISOTimeString | null>(null)
	const [disabled, setDisabled] = useState<ISOTimeString | null>(null)
	const [error, setError] = useState<ISOTimeString | null>(null)
	<Stack direction="vertical" gap={4} style={{width: 400}}>
		<TimeInput label="Required" isRequired value={required} onChange={setRequired} />
		<TimeInput label="Disabled" isDisabled value={disabled} onChange={setDisabled} />
		<TimeInput label="Error" status={{ type: 'error', message: 'Please choose a valid time' }} value={error} onChange={setError} />
	</Stack>
}
