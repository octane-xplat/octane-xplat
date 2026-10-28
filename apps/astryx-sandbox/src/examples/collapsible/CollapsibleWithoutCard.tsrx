// Port of upstream Collapsible/CollapsibleWithoutCard.tsx (Astryx 0.6.4, MIT).
import { Collapsible, Divider, Stack, Text } from '@octane-xplat/ui'

const t = (s: string) => (
	<Text type="body" weight="semibold">
		{s}
	</Text>
)

export function CollapsibleWithoutCard() @{
	<Stack gap={3} maxWidth={480}>
		<Collapsible trigger={t('Deployment details')} value="deployment">
			<Stack gap={1}>
				<Text type="body" color="secondary">
					Build 4,182 shipped to production from main. 847 modules compiled with no warnings, and
					the bundle came in at 142 KB gzipped — 3 KB under the budget.
				</Text>
				<Text type="supporting">Deployed by Sarah Chen · April 18, 3:42 PM · 2m 14s</Text>
			</Stack>
		</Collapsible>
		<Divider />
		<Collapsible trigger={t('Environment variables')} value="environment">
			<Stack gap={1}>
				<Text type="body" color="secondary">
					12 production variables configured. Values are encrypted at rest and rotated every 90
					days.
				</Text>
				<Text type="supporting">Last rotated March 2 · Managed by Platform team</Text>
			</Stack>
		</Collapsible>
	</Stack>
}
