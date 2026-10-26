// Port of upstream ScrollableArea/ScrollableAreaOverscrollChaining.tsx (Astryx 0.6.4, MIT).
import { Card, Grid, ScrollableArea, Section, Text, VStack } from '@octane-xplat/ui'

const SHARED = [
	{ id: 'brand', title: 'Brand refresh', meta: 'Priya Raman' },
	{ id: 'checkout', title: 'Checkout audit', meta: 'Tomas Lindqvist' },
	{ id: 'partner', title: 'Partner deck', meta: 'Ines Okafor' },
	{ id: 'research', title: 'Research synthesis', meta: 'Mei Watanabe' },
	{ id: 'tax', title: 'Tax region notes', meta: 'Hugo Bernard' },
	{ id: 'sso', title: 'SSO rollout plan', meta: 'Sofia Marchetti' },
]
const ARCHIVED = [
	{ id: 'roadmap', title: '2025 roadmap', meta: 'Archived in March' },
	{ id: 'legacy', title: 'Legacy pricing', meta: 'Archived in March' },
	{ id: 'kit', title: 'Old brand kit', meta: 'Archived in January' },
	{ id: 'beta', title: 'Beta feedback', meta: 'Archived in January' },
	{ id: 'survey', title: 'Q4 survey results', meta: 'Archived in January' },
	{ id: 'offsite', title: 'Offsite agenda', meta: 'Archived last year' },
]

function FileGrid({ files }: { files: Array<{ id: string; title: string; meta: string }> }) @{
	<Grid columns={2} style={{ gap: 8 }}>
		{files.map((file) => (
			<Card key={file.id} variant="muted" padding={3}>
				<VStack gap={1}>
					<Text weight="medium" maxLines={1}>{file.title}</Text>
					<Text type="supporting" maxLines={1}>{file.meta}</Text>
				</VStack>
			</Card>
		))}
	</Grid>
}

export function ScrollableAreaOverscrollChaining() @{
	<Card width={400} padding={0}>
		<ScrollableArea axis="block" role="region" label="Workspace files" height={300}>
			<VStack gap={4} padding={4}>
				<VStack gap={2}>
					<Text type="label">Shared</Text>
					<Section style={{ border: '1px solid var(--color-border)', borderRadius: 6 }}>
						<ScrollableArea axis="block" role="group" label="Shared files" height={200}>
							<VStack gap={2} padding={3}>
								<FileGrid files={SHARED} />
							</VStack>
						</ScrollableArea>
					</Section>
				</VStack>
				<VStack gap={2}>
					<Text type="label">Archived</Text>
					<FileGrid files={ARCHIVED} />
				</VStack>
			</VStack>
		</ScrollableArea>
	</Card>
}
