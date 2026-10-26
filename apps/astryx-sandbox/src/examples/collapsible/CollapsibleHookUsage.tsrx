// Port of upstream Collapsible/CollapsibleHookUsage.tsx (Astryx 0.6.4, MIT).
// Upstream useCollapsible hook → composed with the shared Collapsible part
// (controlled by open/onOpenChange) — same exercised contract.
import { useState } from 'octane'
import { Button, Card, Collapsible, Text, VStack } from '@octane-xplat/ui'

export function CollapsibleHookUsage() @{
	const [open, setOpen] = useState(true)
	<Card width={360} padding={4}>
		<VStack gap={3}>
			<Text type="body" weight="bold">Release checklist</Text>
			<Collapsible
				value="release-notes"
				open={open}
				onOpenChange={setOpen}
				trigger={<Button label={open ? 'Hide details' : 'Show details'} variant="secondary" />}
			>
				<Text type="body" color="secondary">Review docs, run visual checks, and confirm keyboard behavior before shipping the component update.</Text>
			</Collapsible>
		</VStack>
	</Card>
}
