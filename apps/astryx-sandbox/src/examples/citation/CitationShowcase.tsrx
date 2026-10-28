// Port of upstream Citation/CitationShowcase.tsx (Astryx 0.6.4, MIT).
import { Citation, Stack, Text } from '@octane-xplat/ui'

export function CitationShowcase() {
	return (
		<Stack direction="vertical" gap={6}>
			<Stack direction="vertical" gap={2}>
				<Text type="supporting" color="secondary">
					Label variant
				</Text>
				<Stack direction="horizontal" gap={2} wrap="wrap">
					<Citation
						source={{ title: 'React Documentation', url: 'https://react.dev' }}
						number={1}
						variant="label"
					/>
					<Citation
						source={{
							title: 'GitHub',
							url: 'https://github.com',
							icon: 'https://github.githubassets.com/favicons/favicon.svg',
						}}
						number={2}
						variant="label"
					/>
					<Citation source={{ title: 'Internal reference' }} number={3} variant="label" />
				</Stack>
			</Stack>
			<Stack direction="vertical" gap={2}>
				<Text type="supporting" color="secondary">
					Number variant
				</Text>
				<Stack direction="horizontal" gap={2}>
					<Citation
						source={{ title: 'TypeScript Handbook', url: 'https://typescriptlang.org' }}
						number={1}
						variant="number"
					/>
					<Citation
						source={{ title: 'MDN Web Docs', url: 'https://developer.mozilla.org' }}
						number={2}
						variant="number"
					/>
					<Citation source={{ title: 'W3C Specification' }} number={3} variant="number" />
				</Stack>
			</Stack>
		</Stack>
	)
}
