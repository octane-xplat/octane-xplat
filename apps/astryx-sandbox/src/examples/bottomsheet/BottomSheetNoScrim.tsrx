// Port of upstream BottomSheet/BottomSheetNoScrim.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { BottomSheet, Button, Divider, Heading, Section, Text, VStack } from '@octane-xplat/ui'

export function BottomSheetNoScrim() @{
	const [isOpen, setIsOpen] = useState(false)
	const [backgroundClicks, setBackgroundClicks] = useState(0)
	return (
		<Section padding={4}>
			<VStack gap={3}>
				<Heading level={3}>Nearby places</Heading>
				<Text type="body">Background interactions: {backgroundClicks}</Text>
				<Button label="Interact with page" variant="secondary" clickAction={() => setBackgroundClicks((c) => c + 1)} />
				<Button label="Show place details" clickAction={() => setIsOpen(true)} />
			</VStack>
			<BottomSheet isOpen={isOpen} onOpenChange={setIsOpen} label="Place details" height="hug" hasScrim={false}>
				<VStack gap={4} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={3}>Central Park</Heading>
					<Divider />
					<Text type="body">The page remains visible and interactive behind this sheet.</Text>
					<Button label="Close details" clickAction={() => setIsOpen(false)} />
				</VStack>
			</BottomSheet>
		</Section>
	)
}
