// Port of upstream OverflowList/OverflowListMultiRowTags.tsx (Astryx 0.6.4, MIT).
import { Badge, Card, OverflowList } from '@octane-xplat/ui'

const tags = [
	'React',
	'TypeScript',
	'StyleX',
	'Storybook',
	'Vitest',
	'Playwright',
	'ESLint',
	'Prettier',
	'Vite',
	'pnpm',
]

export function OverflowListMultiRowTags() @{
	<Card
		padding={2}
		style={{ resize: 'horizontal', overflow: 'hidden', minWidth: 120, width: 260 }}
	>
		<OverflowList
			gap={1}
			maxRows={2}
			overflowRenderer={(overflowItems: { index: number }[]) => (
				<Badge variant="neutral" label={`+${overflowItems.length}`} />
			)}
		>
			{tags.map((tag) => (
				<Badge key={tag} variant="info" label={tag} />
			))}
		</OverflowList>
	</Card>
}
