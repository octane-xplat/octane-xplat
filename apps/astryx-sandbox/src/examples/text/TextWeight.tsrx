// Port of upstream Text/TextWeight.tsx (Astryx 0.6.4, MIT).
// weight prop → inline style (dynamic-value channel).
import { Stack, Text } from '@octane-xplat/ui'

const WEIGHTS = [
	{ weight: 400, label: 'Normal' },
	{ weight: 500, label: 'Medium' },
	{ weight: 600, label: 'Semibold' },
	{ weight: 700, label: 'Bold' },
] as const

export function TextWeight() @{
	return (
		<Stack direction="vertical" gap={3}>
			{WEIGHTS.map(({ weight, label }) => (
				<Text key={weight} type="body" className="sb-block" style={{ fontWeight: weight }}>
					{label}
				</Text>
			))}
		</Stack>
	)
}
