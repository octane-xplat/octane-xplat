// Port of upstream Token/TokenIcon.tsx (Astryx 0.6.4, MIT).
import { Icon, Stack, Text, Token } from '@octane-xplat/ui'

export function TokenIcon() @{
	<Stack direction="vertical" gap={4}>
		<Text type="supporting" color="secondary">Icons identify the token category</Text>
		<Stack direction="horizontal" gap={2} wrap="wrap">
			<Token label="Sarah Chen" color="blue" icon={<Icon name="sandbox-user" size={16} color="inherit" />} />
			<Token label="Featured" color="yellow" icon={<Icon name="sandbox-bookmark" size={16} color="inherit" />} />
			<Token label="Design" color="purple" icon={<Icon name="sandbox-tag" size={16} color="inherit" />} />
			<Token label="Verified" color="green" icon={<Icon name="sandbox-check" size={16} color="inherit" />} />
		</Stack>
	</Stack>
}
