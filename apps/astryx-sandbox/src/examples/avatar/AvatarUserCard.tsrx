// Port of upstream Avatar/AvatarUserCard.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarStatusDot, Card, HStack, Text, VStack } from '@octane-xplat/ui'

const user = { name: 'Itai Jordaan', role: 'Product Engineer', variant: 'success' as const }

export function AvatarUserCard() @{
	<Card width={280}>
		<HStack gap={3} vAlign="center">
			<Avatar
				name={user.name}
				size="lg"
				status={<AvatarStatusDot variant={user.variant} label={user.variant} />}
			/>
			<VStack gap={0}>
				<Text type="body" weight="bold">
					{user.name}
				</Text>
				<Text type="supporting" color="secondary">
					{user.role}
				</Text>
			</VStack>
		</HStack>
	</Card>
}
