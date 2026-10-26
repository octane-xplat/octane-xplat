// Port of upstream ScrollableArea/ScrollableAreaShowcase.tsx (Astryx 0.6.4, MIT).
import { Card, ScrollableArea, Text, VStack } from '@octane-xplat/ui'

const NOTES = [
	['Quarterly planning', 'Draft agenda and owners for the next quarter'],
	['Launch checklist', 'Items to finish before the public rollout'],
	['Research notes', 'Interview highlights from the last sprint'],
	['Design sync', 'Follow-ups from the weekly sync'],
	['Roadmap review', 'Priorities for the upcoming release'],
	['Support triage', 'New tickets grouped by impact'],
]

export function ScrollableAreaShowcase() @{
	<Card width={420} padding={0}>
		<ScrollableArea axis="block" role="region" label="Notes" height={220} padding={4}>
			<VStack gap={3}>
				{NOTES.map(([title, meta]) => (
					<VStack key={title} gap={0.5}>
						<Text weight="medium">{title}</Text>
						<Text type="supporting" color="secondary">{meta}</Text>
					</VStack>
				))}
			</VStack>
		</ScrollableArea>
	</Card>
}
