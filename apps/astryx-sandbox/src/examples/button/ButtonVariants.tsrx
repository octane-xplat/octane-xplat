// Port of upstream Button/ButtonVariants.tsx (Astryx 0.6.4, MIT).
// Text type/color props map to the app's token classes — see sandbox.css.
import { Button, Stack, Text } from '@octane-xplat/ui'

const VARIANTS = [
	{ variant: 'primary' as const, label: 'Primary' },
	{ variant: 'secondary' as const, label: 'Secondary' },
	{ variant: 'ghost' as const, label: 'Ghost' },
	{ variant: 'destructive' as const, label: 'Destructive' },
]

export function ButtonVariants() @{
	return (
		<Stack direction="vertical" gap={4}>
			{(['default', 'disabled', 'loading'] as const).map((state) => (
				<Stack direction="vertical" gap={1} key={state}>
					<Text className="sb-type-supporting sb-color-secondary">
						{state === 'default' ? 'Default' : state === 'disabled' ? 'Disabled' : 'Loading'}
					</Text>
					<Stack direction="horizontal" gap={3} vAlign="center">
						{VARIANTS.map(({ variant, label }) => (
							<Button
								key={variant}
								label={label}
								variant={variant}
								isDisabled={state === 'disabled'}
								isLoading={state === 'loading'}
							/>
						))}
					</Stack>
				</Stack>
			))}
		</Stack>
	)
}
