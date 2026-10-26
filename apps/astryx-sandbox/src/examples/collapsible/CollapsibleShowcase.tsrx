// Port of upstream Collapsible/CollapsibleShowcase.tsx (Astryx 0.6.4, MIT).
import { Card, Collapsible, CollapsibleGroup, Stack, Text } from '@octane-xplat/ui'

const t = (s: string) => <Text type="body" weight="semibold">{s}</Text>

export function CollapsibleShowcase() @{
	<Card width={420}>
		<CollapsibleGroup type="single" defaultValue="notifications">
			<Stack gap={4}>
				<Collapsible trigger={t('General')} value="general"><Text type="body" color="secondary">Display name, language, and time zone. Time zone drives every date shown in the product, including scheduled reports.</Text></Collapsible>
				<Collapsible trigger={t('Notifications')} value="notifications"><Stack gap={2}><Text type="body" color="secondary">Choose which email and push notifications you receive. Mentions and direct messages are always delivered — everything else can be turned off or batched into a daily digest.</Text><Text type="body" color="secondary">Quiet hours pause push notifications overnight in your local time zone without affecting email.</Text></Stack></Collapsible>
				<Collapsible trigger={t('Privacy')} value="privacy"><Text type="body" color="secondary">Control who can see your profile and activity, and whether your workspace appears in search for people outside your organization.</Text></Collapsible>
			</Stack>
		</CollapsibleGroup>
	</Card>
}
