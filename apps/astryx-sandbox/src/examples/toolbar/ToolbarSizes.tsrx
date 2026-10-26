// Port of upstream Toolbar/ToolbarSizes.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Heading, Stack, Toolbar } from '@octane-xplat/ui'

const SIZES = [
	{ size: 'sm' as const, label: 'Small' },
	{ size: 'md' as const, label: 'Medium' },
	{ size: 'lg' as const, label: 'Large' },
]

export function ToolbarSizes() @{
	<Stack direction="vertical" gap={4} style={{ width: 500 }}>
		{SIZES.map(({ size, label }) => (
			<Card key={size}>
				<Toolbar
					label={`${label} toolbar`}
					size={size}
					startContent={<Heading level={4}>{label}</Heading>}
					endContent={<Button label="Action" size={size} variant="secondary" />}
				/>
			</Card>
		))}
	</Stack>
}
