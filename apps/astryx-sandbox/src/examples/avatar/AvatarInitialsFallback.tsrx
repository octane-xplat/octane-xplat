// Port of upstream Avatar/AvatarInitialsFallback.tsx (Astryx 0.6.4, MIT).
import { Avatar, Stack, Text } from '@octane-xplat/ui'

const names = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Radia Perlman']

export function AvatarInitialsFallback() @{
	<Stack direction="vertical" gap={3}>
		{names.map((name) => (
			<Stack key={name} direction="horizontal" gap={2} vAlign="center">
				<Avatar name={name} size="lg" />
				<Text type="body">{name}</Text>
			</Stack>
		))}
	</Stack>
}
