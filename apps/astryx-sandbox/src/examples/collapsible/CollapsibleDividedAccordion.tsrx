// Port of upstream Collapsible/CollapsibleDividedAccordion.tsx (Astryx 0.6.4, MIT).
import { Collapsible, CollapsibleGroup, Link, Stack, Text } from '@octane-xplat/ui'

const q = (text: string) => <Text type="body" weight="semibold">{text}</Text>

export function CollapsibleDividedAccordion() @{
	<Stack gap={3} maxWidth={560}>
		<Text type="label">Billing and plans</Text>
		<CollapsibleGroup type="single" hasDividers defaultValue="proration">
			<Collapsible trigger={q('How is my bill prorated when I change plans mid-cycle?')} value="proration">
				<Stack gap={2}>
					<Text type="body" color="secondary">Upgrades take effect immediately and we charge the difference for the days remaining in the cycle. Downgrades take effect at the next renewal, so you keep the higher tier until the period you already paid for runs out.</Text>
					<Text type="body" color="secondary">Seat changes work the same way: added seats are prorated to the day, removed seats free up at renewal.</Text>
				</Stack>
			</Collapsible>
			<Collapsible trigger={q('Can I change my username?')} value="username">
				<Text type="body" color="secondary">Once every 30 days, from your profile settings. Old links keep working — we redirect them for a year.</Text>
			</Collapsible>
			<Collapsible trigger={q('What happens to my data if I cancel?')} value="cancel">
				<Stack gap={2}>
					<Text type="body" color="secondary">Your workspace goes read-only at the end of the billing period. Nothing is deleted for 30 days, so reactivating inside that window restores everything exactly as it was.</Text>
					<Text type="body" color="secondary">After 30 days the workspace and its backups are permanently removed. Export first if you want a copy — an export covers documents, comments, and version history.</Text>
					<Link href="#export" isStandalone hasUnderline>How to export your workspace</Link>
				</Stack>
			</Collapsible>
			<Collapsible trigger={q('Do you offer discounts for non-profits or education?')} value="discounts">
				<Text type="body" color="secondary">Yes — 50% off any paid plan for registered non-profits and accredited schools. Email your documentation and we usually apply it within two business days.</Text>
			</Collapsible>
		</CollapsibleGroup>
	</Stack>
}
