// Port of upstream Breadcrumbs/BreadcrumbsCustomSeparator.tsx (Astryx 0.6.4, MIT).
import { BreadcrumbItem, Breadcrumbs, Stack, Text } from '@octane-xplat/ui'

const SEPARATORS = [
	{ char: '›', label: 'Chevron' },
	{ char: '→', label: 'Arrow' },
	{ char: '·', label: 'Dot' },
]

export function BreadcrumbsCustomSeparator() @{
	<Stack direction="vertical" gap={4}>
		{SEPARATORS.map(({ char, label }) => (
			<Stack key={label} direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">{label}</Text>
				<Breadcrumbs separator={char}>
					<BreadcrumbItem href="/">Home</BreadcrumbItem>
					<BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
					<BreadcrumbItem isCurrent>API Reference</BreadcrumbItem>
				</Breadcrumbs>
			</Stack>
		))}
	</Stack>
}
