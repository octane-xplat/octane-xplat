// Port of upstream Divider/DividerShowcase.tsx (Astryx 0.6.4, MIT).
import { Divider, Stack } from '@octane-xplat/ui'

export function DividerShowcase() @{
	<Stack direction="vertical" gap={4} style={{ width: 500 }}>
		<Divider variant="subtle" />
		<Divider variant="strong" />
		<Divider label="or" />
	</Stack>
}
