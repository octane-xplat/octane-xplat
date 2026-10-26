// Port of upstream Stack/StackFillItem.tsx (Astryx 0.6.4, MIT).
import { Avatar, Button, Stack, StackItem, Text } from '@octane-xplat/ui'

const USERS = [
	{ name: 'Olivia Chen', role: 'Engineering Lead' },
	{ name: 'Marcus Rivera', role: 'Product Designer' },
	{ name: 'Aisha Patel', role: 'Marketing Manager' },
]

export function StackFillItem() @{
	<Stack direction="vertical" gap={3} width="100%" style={{ maxWidth: 300 }}>
		{USERS.map((user) => (
			<Stack key={user.name} direction="horizontal" gap={3} vAlign="center">
				<StackItem size="static"><Avatar name={user.name} size="md" /></StackItem>
				<StackItem size="fill">
					<Stack direction="vertical" gap={0}>
						<Text type="body" weight="bold">{user.name}</Text>
						<Text type="supporting" color="secondary">{user.role}</Text>
					</Stack>
				</StackItem>
				<StackItem size="static"><Button label="View" variant="secondary" size="sm" /></StackItem>
			</Stack>
		))}
	</Stack>
}
