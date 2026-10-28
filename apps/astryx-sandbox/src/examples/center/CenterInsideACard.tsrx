// Port of upstream Center/CenterInsideACard.tsx (Astryx 0.6.4, MIT).
import { Card, Center, Icon, Stack, Text } from '@octane-xplat/ui'

export function CenterInsideACard() @{
	<Card width={400}>
		<Center height={200}>
			<Stack direction="vertical" gap={2} hAlign="center">
				<Icon name="sandbox-envelope" size={24} color="secondary" />
				<Text type="body" weight="bold">
					No messages yet
				</Text>
				<Text type="supporting" color="secondary">
					Messages from your team will appear here.
				</Text>
			</Stack>
		</Center>
	</Card>
}
