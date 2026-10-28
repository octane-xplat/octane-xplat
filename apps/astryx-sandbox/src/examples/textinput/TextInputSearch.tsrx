// Port of upstream TextInput/TextInputSearch.tsx (Astryx 0.6.4, MIT).
import { TextInput, Stack, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextInputSearch() @{
	const [query, setQuery] = useState('')
	const [filter, setFilter] = useState('design systems')

	<div style={{ width: 300 }}>
		<Stack direction="vertical" gap={3}>
			<TextInput
				label="Search field"
				value={query}
				onChange={setQuery}
				placeholder="Search projects…"
				startIcon={<Icon name="sandbox-magnifying-glass" size={16} />}
				hasClear
			/>
			<TextInput
				label="Search field with value"
				value={filter}
				onChange={setFilter}
				placeholder="Filter…"
				startIcon={<Icon name="sandbox-magnifying-glass" size={16} />}
				hasClear
			/>
		</Stack>
	</div>
}
