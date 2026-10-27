// Port of InternationalizationProvider examples, Astryx 0.6.4 (Meta Platforms, MIT).
import {
	InternationalizationProvider,
	Selector,
	SegmentedControl,
	VStack,
	frFR,
} from '@octane-xplat/ui'

import { useState } from 'octane'
import './internationalization.css'
const options = [
	{ value: 'americas', label: 'Americas' },
	{ value: 'emea', label: 'EMEA' },
	{ value: 'apac', label: 'APAC' },
]

export function InternationalizationProvider01ShippedLocale() @{
	const [locale, setLocale] = useState('en')
	const [value, setValue] = useState<string | null>(null)

	<InternationalizationProvider locale={locale} messages={{ 'fr-FR': frFR }}>
		<VStack gap={4}>
			<SegmentedControl
				label="Language"
				accessibilityLabel="Language"
				value={locale}
				onValueChange={setLocale}
				options={[
					{ value: 'en', label: 'EN' },
					{ value: 'fr-FR', label: 'FR' },
				]}
			/>
			<Selector
				label="Billing region"
				options={options}
				value={value}
				onValueChange={setValue}
				hasClear
				className="sb-locale-selector"
			/>
		</VStack>
	</InternationalizationProvider>
}
