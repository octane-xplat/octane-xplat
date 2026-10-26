// Port of upstream Outline/OutlineControlled.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Button, HStack, Outline, Text, VStack } from '@octane-xplat/ui'

const items = [
	{ id: 'ctrl-summary', label: 'Summary', level: 2 },
	{ id: 'ctrl-details', label: 'Details', level: 2 },
	{ id: 'ctrl-results', label: 'Results', level: 2 },
	{ id: 'ctrl-next-steps', label: 'Next steps', level: 2 },
]

export function OutlineControlled() @{
	const [activeId, setActiveId] = useState('ctrl-details')
	const index = items.findIndex((item) => item.id === activeId)
	const goTo = (next: number) => {
		const clamped = Math.max(0, Math.min(items.length - 1, next))
		setActiveId(items[clamped].id)
	}
	<VStack gap={4} style={{ width: 240 }}>
		<Outline items={items} activeId={activeId} onActiveIdChange={setActiveId} />
		<HStack gap={2}>
			<Button variant="secondary" size="sm" label="Previous" clickAction={() => goTo(index - 1)} />
			<Button variant="secondary" size="sm" label="Next" clickAction={() => goTo(index + 1)} />
		</HStack>
		<Text type="supporting" color="secondary">Active section: {items[index]?.label}</Text>
	</VStack>
}
