// Port of upstream Text/TextColors.tsx (Astryx 0.6.4, MIT).
// color=placeholder approximates --color-text-disabled until a dedicated
// placeholder token exists — recorded as an adaptation in docs/coverage.md.
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
				<Text key={color} className={`sb-type-body sb-color-${color}`}>
					{description}
				</Text>
			))}
		</Stack>
	)
}
