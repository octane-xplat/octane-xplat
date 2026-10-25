// Port of upstream Text/TextWrap.tsx (Astryx 0.6.4, MIT).
// textWrap prop → inline white-space/text-wrap styles.
import { Stack, Text, View } from '@octane-xplat/ui'

const CASES: { label: string; style: Record<string, string>; text: string; box?: string }[] = [
	{ label: 'Wrap (default)', style: {}, text: 'This text wraps normally at word boundaries when it reaches the edge.' },
	{ label: 'Nowrap', style: { whiteSpace: 'nowrap' }, text: 'This text does not wrap and will overflow its container.', box: 'sb-example-box--truncate' },
	{ label: 'Balance', style: { textWrap: 'balance' }, text: 'This text is balanced for better visual appearance across lines.' },
	{ label: 'Pretty', style: { textWrap: 'pretty' }, text: 'This text uses pretty wrap to avoid orphans at the end of paragraphs.' },
]

export function TextWrap() @{
	return (
		<Stack direction="vertical" gap={4} style={{ maxWidth: 400 }}>
			{CASES.map(({ label, style, text, box }) => (
				<View key={label}>
					<Text className="sb-type-label sb-block">{label}</Text>
					<View className={box ?? 'sb-example-box'} style={{ width: 200 }}>
						<Text className="sb-type-body" style={style}>
							{text}
						</Text>
					</View>
				</View>
			))}
		</Stack>
	)
}
