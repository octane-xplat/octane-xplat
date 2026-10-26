// Port of upstream CollapsibleGroup/CollapsibleGroupAccordion.tsx (Astryx 0.6.4, MIT).
import { Collapsible, CollapsibleGroup, Stack, Text } from '@octane-xplat/ui'

export function CollapsibleGroupAccordion() @{
	<CollapsibleGroup type="single" defaultValue="one">
		<Stack gap={2} maxWidth={420}>
			<Collapsible trigger="Section one" value="one"><Text type="body" color="secondary">Only one section stays open at a time.</Text></Collapsible>
			<Collapsible trigger="Section two" value="two"><Text type="body" color="secondary">Opening this closes section one.</Text></Collapsible>
		</Stack>
	</CollapsibleGroup>
}
