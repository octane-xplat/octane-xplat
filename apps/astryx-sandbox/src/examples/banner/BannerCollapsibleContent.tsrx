// Port of upstream Banner/BannerCollapsibleContent.tsx (Astryx 0.6.4, MIT).
import { Banner, Button, List, ListItem, Stack, Text } from '@octane-xplat/ui'

export function BannerCollapsibleContent() @{
	<Banner
		status="warning"
		title="Configuration changes detected"
		description="Review the changes before they take effect."
		endContent={<Button label="Review" variant="secondary" size="sm" />}
		isDismissable
		collapsible={{ defaultIsOpen: true }}
	>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">
				Changed settings:
			</Text>
			<List density="compact">
				<ListItem label="Authentication method updated" />
				<ListItem label="Rate limits modified" />
			</List>
		</Stack>
	</Banner>
}
