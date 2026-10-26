// Port of upstream Collapsible/CollapsibleMultipleAccordion.tsx (Astryx 0.6.4, MIT).
import { Card, Collapsible, CollapsibleGroup, Stack, Text } from '@octane-xplat/ui'

export function CollapsibleMultipleAccordion() @{
	<CollapsibleGroup type="multiple" defaultValue={['features', 'pricing']}>
		<Stack gap={2} maxWidth={440}>
			<Card><Collapsible trigger="Features" value="features"><Text type="body" color="secondary">Real-time collaboration, full version history, and granular permissions. Every plan includes unlimited documents and unlimited guests — seats are counted for editors only.</Text></Collapsible></Card>
			<Card><Collapsible trigger="Pricing" value="pricing"><Stack gap={2}><Text type="body" color="secondary">Free for up to 5 editors. Pro is $12 per editor per month billed annually, or $15 month to month.</Text><Text type="supporting">Non-profit and education pricing is 50% off any paid plan.</Text></Stack></Collapsible></Card>
			<Card><Collapsible trigger="Integrations" value="integrations"><Text type="body" color="secondary">Slack, GitHub, Jira, Figma, and 40 more through pre-built connectors, plus a REST API and outbound webhooks for anything not on the list.</Text></Collapsible></Card>
		</Stack>
	</CollapsibleGroup>
}
