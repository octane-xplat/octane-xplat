// Port of upstream Token/TokenClickable.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Token } from '@octane-xplat/ui'

export function TokenClickable() @{
	<Stack direction="vertical" gap={4}>
		<Text type="supporting" color="secondary">
			Click a token to view details
		</Text>
		<Stack direction="horizontal" gap={2} wrap="wrap">
			<Token label="Bug" color="red" onClick={() => {}} />
			<Token label="Feature" color="blue" onClick={() => {}} />
			<Token label="Enhancement" color="green" onClick={() => {}} />
			<Token label="Documentation" color="gray" onClick={() => {}} />
		</Stack>
	</Stack>
}
