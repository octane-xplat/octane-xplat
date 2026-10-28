// Port of upstream Switch/SwitchWithStatus.tsx (Astryx 0.6.4, MIT).
import { Switch, VStack, Center } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SwitchWithStatus() @{
	const [terms, setTerms] = useState(false)
	const [sharing, setSharing] = useState(true)
	const [twoFactor, setTwoFactor] = useState(true)

	<Center width={400}>
		<VStack gap={6} style={{ maxWidth: 400, width: '100%' }}>
			<Switch
				label="Accept terms and conditions"
				value={terms}
				onChange={setTerms}
				isRequired
				status={{ type: 'error', message: 'You must accept the terms to continue' }}
			/>
			<Switch
				label="Share usage data"
				description="Help us improve by sharing anonymous usage statistics"
				value={sharing}
				onChange={setSharing}
				status={{ type: 'warning', message: 'This data may be shared with partners' }}
			/>
			<Switch
				label="Two-factor authentication"
				value={twoFactor}
				onChange={setTwoFactor}
				status={{ type: 'success', message: 'Your account is now more secure' }}
			/>
		</VStack>
	</Center>
}
