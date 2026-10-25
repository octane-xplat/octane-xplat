// Port of upstream NumberInput/NumberInputStatuses.tsx (Astryx 0.6.4, MIT).
import { NumberInput, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function NumberInputStatuses() @{
	const [error, setError] = useState<number | null>(-5)
	const [warning, setWarning] = useState<number | null>(150)
	const [success, setSuccess] = useState<number | null>(25)
	<div style={{width: 300}}>
		<VStack gap={4}>
			<NumberInput label="Budget" value={error} onValueChange={setError} status={{ type: 'error', message: 'Must be a positive amount' }} />
			<NumberInput label="Headcount" value={warning} onValueChange={setWarning} status={{ type: 'warning', message: 'Exceeds typical team size' }} />
			<NumberInput label="Completion" units="%" value={success} onValueChange={setSuccess} status={{ type: 'success', message: 'On track' }} />
		</VStack>
	</div>
}
