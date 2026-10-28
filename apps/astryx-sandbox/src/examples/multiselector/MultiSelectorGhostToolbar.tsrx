// Port of upstream MultiSelector/MultiSelectorGhostToolbar.tsx (Astryx 0.6.4, MIT).
import { MultiSelector, Stack, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function MultiSelectorGhostToolbar() @{
	const [tags, setTags] = useState<string[]>([])

	<Stack direction="horizontal" gap={2}>
		<Text type="label" style={{ alignSelf: 'center' }}>
			Tags:
		</Text>
		<MultiSelector
			variant="ghost"
			options={[
				{ value: 'urgent', label: 'Urgent' },
				{ value: 'bug', label: 'Bug' },
				{ value: 'feature', label: 'Feature' },
				{ value: 'docs', label: 'Documentation' },
			]}
			value={tags}
			onValueChange={setTags}
			placeholder="Filter by tag"
		/>
	</Stack>
}
