// Port of upstream Divider/DividerVertical.tsx (Astryx 0.6.4, MIT).
import { Card, Divider, HStack, Section, StackItem, Text, VStack } from '@octane-xplat/ui'

const dividerFill = { alignSelf: 'stretch', height: 'auto' } as const

const stats = [
	['Revenue', '$24,500', '+12% vs last month'],
	['Users', '1,240', '+8% vs last month'],
	['Conversion', '3.2%', '-0.5% vs last month'],
] as const

export function DividerVertical() @{
	<Section variant="transparent" width="100%">
		<Card>
			<HStack gap={4} align="stretch">
				{stats.map(([label, value, delta], i) => (
					<>
						{i > 0 ? <Divider orientation="vertical" style={dividerFill} /> : null}
						<StackItem size="fill">
							<VStack gap={1}>
								<Text type="label">{label}</Text>
								<Text type="label">{value}</Text>
								<Text type="supporting" color="secondary">{delta}</Text>
							</VStack>
						</StackItem>
					</>
				))}
			</HStack>
		</Card>
	</Section>
}
