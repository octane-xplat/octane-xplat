// Port of upstream Outline/OutlineDensity.tsx (Astryx 0.6.4, MIT).
import { Outline, Text, VStack } from '@octane-xplat/ui'

const items = [
	{ id: 'density-getting-started', label: 'Getting started', level: 2 },
	{ id: 'density-install', label: 'Install', level: 3 },
	{ id: 'density-usage', label: 'Usage', level: 3 },
	{ id: 'density-api', label: 'API', level: 2 },
	{ id: 'density-faq', label: 'FAQ', level: 2 },
]

export function OutlineDensity() @{
	<VStack gap={4} style={{ width: 240 }}>
		<VStack gap={1}>
			<Text type="supporting" color="secondary">
				Default
			</Text>
			<Outline items={items} activeId="density-install" />
		</VStack>
		<VStack gap={1}>
			<Text type="supporting" color="secondary">
				Compact
			</Text>
			<Outline items={items} activeId="density-install" density="compact" />
		</VStack>
	</VStack>
}
