// Port of upstream IconButton/IconButtonFloating.tsx (Astryx 0.6.4, MIT).
import { Icon, IconButton, Stack, Text } from '@octane-xplat/ui'

const VARIANTS = [
	{ variant: 'primary' as const, label: 'Primary' },
	{ variant: 'secondary' as const, label: 'Secondary' },
	{ variant: 'ghost' as const, label: 'Ghost' },
	{ variant: 'destructive' as const, label: 'Destructive' },
]

export function IconButtonFloating() @{
	<Stack direction="vertical" gap={4}>
		<Text type="supporting" color="secondary">FABs are usually icon-only — raise one with `elevation="high"`</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			{VARIANTS.map(({ variant, label }) => (
				<IconButton key={variant} label={label} variant={variant} icon={<Icon name="sandbox-plus" />} elevation="high" />
			))}
		</Stack>
	</Stack>
}
