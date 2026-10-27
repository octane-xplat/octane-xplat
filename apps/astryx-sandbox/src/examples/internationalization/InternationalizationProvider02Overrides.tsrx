// Port of InternationalizationProvider examples, Astryx 0.6.4 (Meta Platforms, MIT).
import {
	Button,
	InternationalizationProvider,
	Selector,
	VStack,
	useAnnounce,
} from '@octane-xplat/ui'

import { useState } from 'octane'
import './internationalization.css'
const options = [
	{ value: 'americas', label: 'Americas' },
	{ value: 'emea', label: 'EMEA' },
	{ value: 'apac', label: 'APAC' },
]

export function InternationalizationProvider02Overrides() @{
	const [value, setValue] = useState<string | null>(null)
	const announce = useAnnounce()

	<VStack gap={4}>
		<InternationalizationProvider
			locale="en"
			overrides={{ en: { '@astryx.selector.placeholder': 'Choose...' } }}
		>
			<Selector
				label="Billing region"
				options={options}
				value={value}
				onValueChange={setValue}
				hasClear
				className="sb-locale-selector"
			/>
		</InternationalizationProvider>
		<Button label="Announce saved" clickAction={() => announce('Billing region saved')} />
		<Button
			label="Announce error"
			clickAction={() => announce('Billing region required', 'assertive')}
		/>
		<Button
			label="Clear announcements"
			clickAction={() => {
				announce('')
				announce('', 'assertive')
			}}
		/>
	</VStack>
}
