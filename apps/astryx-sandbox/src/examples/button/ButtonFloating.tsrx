// Port of upstream Button/ButtonFloating.tsx (Astryx 0.6.4, MIT).
// Heroicons PlusIcon → registered 'sandbox-plus' glyph (same MIT path data).
import { Button, Stack, Text } from '@octane-xplat/ui'

const VARIANTS = [
	{ variant: 'primary' as const, label: 'Primary' },
	{ variant: 'secondary' as const, label: 'Secondary' },
	{ variant: 'ghost' as const, label: 'Ghost' },
	{ variant: 'destructive' as const, label: 'Destructive' },
]

export function ButtonFloating() @{
	return (
		<Stack direction="vertical" gap={4}>
			<Text type="supporting" color="secondary">
				Floating action buttons — raised above content with elevation="med"
			</Text>
			<Stack direction="horizontal" gap={3} vAlign="center">
				{VARIANTS.map(({ variant, label }) => (
					<Button
						key={variant}
						label={label}
						variant={variant}
						icon="sandbox-plus"
						elevation="med"
					/>
				))}
			</Stack>
		</Stack>
	)
}
