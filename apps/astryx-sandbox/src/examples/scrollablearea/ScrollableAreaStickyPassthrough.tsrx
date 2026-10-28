// Port of upstream ScrollableArea/ScrollableAreaStickyPassthrough.tsx (Astryx 0.6.4, MIT).
import { Card, ScrollableArea, Text, VStack } from '@octane-xplat/ui'

const ROWS = Array.from({ length: 12 }, (_, i) => `Row ${i + 1}`)

export function ScrollableAreaStickyPassthrough() @{
	<Card width={400} padding={0}>
		<ScrollableArea axis="both" role="region" label="Sheet" height={220} width="100%">
			<div style={{ minWidth: 700 }}>
				<Text
					type="label"
					color="secondary"
					style={{
						position: 'sticky',
						top: 0,
						left: 0,
						background: 'var(--color-surface, #fff)',
						padding: '8px 16px',
						display: 'block',
						zIndex: 1,
					}}
				>
					Sticky header — stays put while scrolling either axis
				</Text>
				<VStack gap={1} padding={3}>
					{ROWS.map((row) => (
						<Text key={row} type="body" style={{ whiteSpace: 'nowrap' }}>
							{row} — wide content column that overflows horizontally to show two-axis scrolling
						</Text>
					))}
				</VStack>
			</div>
		</ScrollableArea>
	</Card>
}
