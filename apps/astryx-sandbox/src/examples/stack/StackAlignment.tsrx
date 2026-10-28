// Port of upstream Stack/StackAlignment.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Stack, Text } from '@octane-xplat/ui'

export function StackAlignment() @{
	<Stack direction="vertical" gap={3} width="100%" style={{ maxWidth: 500 }}>
		{(['start', 'center', 'end'] as const).map((a) => (
			<Card padding={4}>
				<Stack direction="vertical" gap={4}>
					<Text type="supporting" color="secondary">
						{a === 'start' ? 'Start (left)' : a === 'center' ? 'Center' : 'End (right)'}
					</Text>
					<Stack direction="horizontal" gap={1} hAlign={a}>
						<Button label="Cancel" variant="secondary" size="sm" />
						<Button label="Save" variant="primary" size="sm" />
					</Stack>
				</Stack>
			</Card>
		))}
	</Stack>
}
