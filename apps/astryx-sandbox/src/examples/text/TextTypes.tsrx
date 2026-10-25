// Port of upstream Text/TextTypes.tsx (Astryx 0.6.4, MIT).
import { Stack, Text } from '@octane-xplat/ui'

const TYPES: { type: string; label: string; sample: string; extra?: string }[] = [
	{ type: 'body', label: 'Body text', sample: 'Body text for paragraphs and general content' },
	{ type: 'large', label: 'Large text', sample: 'Large text for introductions and callouts' },
	{ type: 'label', label: 'Label text', sample: 'Label text for form fields and section titles' },
	{ type: 'supporting', label: 'Supporting text', sample: 'Supporting text for captions and metadata' },
	{ type: 'code', label: 'Code text', sample: 'const theme = defineTheme({})' },
	{ type: 'body', label: 'Strikethrough', sample: 'Body text with strikethrough decoration', extra: 'sb-strikethrough' },
	{ type: 'body', label: 'Tabular numbers', sample: '1,234.56  78.90  100,000.00', extra: 'sb-tabular' },
]

export function TextTypes() @{
	return (
		<Stack direction="vertical" gap={3}>
			{TYPES.map(({ type, label, sample, extra }) => (
				<Stack key={label} direction="vertical" gap={0}>
					<Text className="sb-type-supporting sb-color-secondary">{label}</Text>
					<Text className={`sb-block sb-type-${type}${extra ? ' ' + extra : ''}`}>{sample}</Text>
				</Stack>
			))}
		</Stack>
	)
}
