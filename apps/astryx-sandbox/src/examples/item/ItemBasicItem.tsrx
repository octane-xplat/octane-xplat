// Port of upstream Item/ItemBasicItem.tsx (Astryx 0.6.4, MIT).
import { Item, Stack, Text } from '@octane-xplat/ui'

export function ItemBasicItem() @{
	<Stack gap={0}>
		<Item label="Quarterly planning" description="Agenda, notes, and action items" endContent={<Text color="secondary">Today</Text>} />
		<Item label="Customer research" description="Interview notes from the latest study" endContent={<Text color="secondary">Yesterday</Text>} />
		<Item label="Launch checklist" description="Remaining tasks before release" endContent={<Text color="secondary">Fri</Text>} />
	</Stack>
}
