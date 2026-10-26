// Port of upstream Token/TokenEndContent.tsx (Astryx 0.6.4, MIT).
import { Badge, Stack, Text, Token } from '@octane-xplat/ui'

export function TokenEndContent() @{
	<Stack direction="vertical" gap={4}>
		<Text type="supporting" color="secondary">Trailing badges for counts or status</Text>
		<Stack direction="horizontal" gap={2} wrap="wrap">
			<Token label="Inbox" color="blue" endContent={<Badge variant="info" label={12} />} />
			<Token label="Reviews" color="purple" endContent={<Badge variant="purple" label={3} />} />
			<Token label="Resolved" color="green" endContent={<Badge variant="success" label="Done" />} />
		</Stack>
	</Stack>
}
