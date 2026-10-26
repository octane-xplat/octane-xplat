// Port of upstream Card/CardVariants.tsx (Astryx 0.6.4, MIT).
import { Card, Stack, Text } from '@octane-xplat/ui'

const VARIANTS = [
	{ variant: 'default', label: 'General', note: '4 tasks due today' },
	{ variant: 'muted', label: 'Archived', note: 'No activity in 30 days' },
	{ variant: 'blue', label: 'Engineering', note: '12 open issues' },
	{ variant: 'green', label: 'Marketing', note: '3 campaigns active' },
	{ variant: 'orange', label: 'Urgent', note: '2 items need review' },
	{ variant: 'purple', label: 'Design', note: '5 drafts in progress' },
] as const

export function CardVariants() @{
	<Stack direction="horizontal" gap={3} wrap="wrap">
		{VARIANTS.map(({ variant, label, note }) => (
			<Card key={variant} variant={variant} width={160}>
				<Stack direction="vertical" gap={1}>
					<Text type="body" weight="bold">{label}</Text>
					<Text type="supporting" color="secondary">{note}</Text>
				</Stack>
			</Card>
		))}
	</Stack>
}
