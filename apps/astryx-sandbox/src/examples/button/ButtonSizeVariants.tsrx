// Port of upstream Button/ButtonSizeVariants.tsx (Astryx 0.6.4, MIT).
import { Button, Stack, Text } from '@octane-xplat/ui'

const SIZES = [
	{ size: 'sm' as const, label: 'Small' },
	{ size: 'md' as const, label: 'Medium' },
	{ size: 'lg' as const, label: 'Large' },
]

export function ButtonSizeVariants() @{
	return (
		<Stack direction="vertical" gap={4}>
			{(['primary', 'secondary'] as const).map((variant) => (
				<Stack direction="vertical" gap={1} key={variant}>
					<Text className="sb-type-supporting sb-color-secondary">
						{variant === 'primary' ? 'Primary' : 'Secondary'}
					</Text>
					<Stack direction="horizontal" gap={3} vAlign="center">
						{SIZES.map(({ size, label }) => (
							<Button key={size} label={label} variant={variant} size={size} />
						))}
					</Stack>
				</Stack>
			))}
		</Stack>
	)
}
