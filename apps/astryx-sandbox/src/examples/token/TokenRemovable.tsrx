// Port of upstream Token/TokenRemovable.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Token } from '@octane-xplat/ui'

export function TokenRemovable() @{
	<Stack direction="vertical" gap={10}>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">Active filters</Text>
			<Stack direction="horizontal" gap={2} wrap="wrap">
				<Token label="Status: Open" color="green" onRemove={() => {}} />
				<Token label="Priority: High" color="red" onRemove={() => {}} />
				<Token label="Team: Design" color="purple" onRemove={() => {}} />
			</Stack>
		</Stack>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">Selected recipients</Text>
			<Stack direction="horizontal" gap={2} wrap="wrap">
				<Token label="Sarah Chen" color="blue" onRemove={() => {}} />
				<Token label="Alex Rivera" color="blue" onRemove={() => {}} />
				<Token label="Jordan Lee" color="blue" onRemove={() => {}} />
			</Stack>
		</Stack>
	</Stack>
}
