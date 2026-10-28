// Measured parity fixtures — assertions live in Accordion.parity.check.ts.
import { Accordion } from './Accordion'
import { View } from './View'
import type { ParityFixture } from './parity'

function AccordionFixture() @{
	<Accordion
		className="parity-accordion-root"
		style={{ width: 180, height: 88, backgroundColor: '#f5f5f5' }}
		open="profile"
		items={[
			{
				key: 'profile',
				header: 'Profile',
				content: <View className="parity-accordion-content" style={{ width: 160, height: 28 }} />,
			},
			{
				key: 'security',
				header: 'Security',
				content: <View style={{ width: 160, height: 28 }} />,
			},
		]}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'accordion-one-open',
		component: 'Accordion',
		renderer: AccordionFixture,
		props: {},
		height: 104,
	},
]
