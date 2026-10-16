// Measured parity fixtures — assertions live in Item.parity.check.ts.
import { Item } from './Item'
import { Text } from './Text'
import type { ParityFixture } from './parity'

function ListItemFixture() @{
	<Item
		className="parity-list-item-root"
		style={{ width: 220, height: 64, backgroundColor: '#f5f5f5' }}
		label="Settings"
		description="Account"
	/>
}

function ListItemStandardFixture() @{
	<Item
		id="parity-listitem-root"
		style={{ width: 220, height: 64, backgroundColor: '#f5f5f5' }}
		label="Event title"
		description="6:30 PM / 2 tickets"
		startContent={<Text className="parity-listitem-leading-text">A</Text>}
		endContent={<Text className="parity-listitem-trailing-text">&gt;</Text>}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'list-item-row', component: 'Item', renderer: ListItemFixture, props: {} },
	{ name: 'list-item-standard', component: 'Item', renderer: ListItemStandardFixture, props: {} },
]
