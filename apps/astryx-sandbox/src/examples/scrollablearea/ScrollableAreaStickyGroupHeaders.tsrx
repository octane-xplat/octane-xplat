// Port of upstream ScrollableArea/ScrollableAreaStickyGroupHeaders.tsx (Astryx 0.6.4, MIT).
import { Card, ScrollableArea, Text, VStack } from '@octane-xplat/ui'

const GROUPS = [
	['Today', ['Standup notes', 'Design review', 'Sprint planning', 'Customer call']],
	['Yesterday', ['Team retro', 'Roadmap sync', 'Bug triage']],
	['Last week', ['Quarterly goals', 'Launch debrief', 'Architecture review', 'Hiring sync']],
] as const

export function ScrollableAreaStickyGroupHeaders() @{
	<Card width={380} padding={0}>
		<ScrollableArea axis="block" role="region" label="Meeting notes" height={260}>
			{GROUPS.map(([group, notes]) => (
				<VStack key={group} gap={0}>
					<Text
						type="label"
						color="secondary"
						style={{ position: 'sticky', top: 0, background: 'var(--color-surface, #fff)', padding: '8px 16px 4px', zIndex: 1 }}
					>
						{group}
					</Text>
					{notes.map((note) => (
						<Text key={note} type="body" style={{ padding: '4px 16px' }}>{note}</Text>
					))}
				</VStack>
			))}
		</ScrollableArea>
	</Card>
}
