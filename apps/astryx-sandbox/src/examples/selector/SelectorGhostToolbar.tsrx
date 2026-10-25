// Port of upstream Selector/SelectorGhostToolbar.tsx (Astryx 0.6.4, MIT).
import { Selector, Stack, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorGhostToolbar() @{
	const [value, setValue] = useState<string | null>('all')
	<Stack direction="horizontal" gap={2}>
		<Text className="sb-type-label" style={{alignSelf: 'center'}}>Filter:</Text>
		<Selector variant="ghost" options={[
			{ value: 'all', label: 'All projects' },
			{ value: 'mine', label: 'My projects' },
			{ value: 'shared', label: 'Shared with me' },
			{ value: 'archived', label: 'Archived' },
		]} value={value} onValueChange={setValue} placeholder="All projects" />
	</Stack>
}
