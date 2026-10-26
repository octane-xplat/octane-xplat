// Port of upstream Token/TokenShowcase.tsx (Astryx 0.6.4, MIT).
import { Icon, Stack, Token } from '@octane-xplat/ui'

export function TokenShowcase() @{
	<Stack direction="horizontal" gap={2} vAlign="center">
		<Token label="Default" />
		<Token label="Removable" color="blue" onRemove={() => {}} />
		<Token label="Design" color="purple" icon={<Icon name="sandbox-tag" size={16} color="inherit" />} />
	</Stack>
}
