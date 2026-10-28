// Port of upstream Citation/CitationSourceList.tsx (Astryx 0.6.4, MIT).
import { Citation, Stack, Text } from '@octane-xplat/ui'

const sources = [
	{
		title: 'React Documentation',
		url: 'https://react.dev',
		icon: 'https://react.dev/favicon-32x32.png',
	},
	{
		title: 'TypeScript Handbook',
		url: 'https://www.typescriptlang.org/docs/handbook/',
		icon: 'https://www.typescriptlang.org/favicon-32x32.png',
	},
	{
		title: 'MDN Web Docs',
		url: 'https://developer.mozilla.org',
		icon: 'https://developer.mozilla.org/favicon-48x48.cbbd161b.png',
	},
	{
		title: 'W3C WAI-ARIA Specification',
		url: 'https://www.w3.org/TR/wai-aria/',
	},
]

export function CitationSourceList() {
	return (
		<Stack direction="vertical" gap={3}>
			<Text type="supporting" color="secondary">
				Sources
			</Text>
			<Stack direction="horizontal" gap={2} wrap="wrap">
				{sources.map((source, i) => (
					<Citation key={source.title} source={source} number={i + 1} variant="label" />
				))}
			</Stack>
		</Stack>
	)
}
