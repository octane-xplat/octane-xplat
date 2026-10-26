// Port of upstream Text/TextColors.tsx (Astryx 0.6.4, MIT).
import { Stack, Text } from '@octane-xplat/ui'

const COLORS = [
	{ color: 'primary', description: 'Primary — Default for headings and body text' },
	{ color: 'secondary', description: 'Secondary — Supporting details and metadata' },
	{ color: 'accent', description: 'Accent — Links, emphasis, and accent-colored text' },
	{ color: 'disabled', description: 'Disabled — Unavailable or inactive content' },
	{ color: 'placeholder', description: 'Placeholder — Empty field hints' },
] as const

export function TextColors() @{
	return (
		<Stack direction="vertical" gap={3}>
			{COLORS.map(({ color, description }) => (
				<Text key={color} type="body" color={color}>
					{description}
				</Text>
			))}
		</Stack>
	)
}
