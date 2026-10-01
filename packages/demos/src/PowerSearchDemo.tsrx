import { useState } from 'octane'
import { Heading, PowerSearch, Text, View, createPowerSearchConfig } from '@octane-xplat/ui'

const books = [
	{ title: 'A Wizard of Earthsea', year: 1968 },
	{ title: 'The Left Hand of Darkness', year: 1969 },
	{ title: 'The Dispossessed', year: 1974 },
]

const { config, applyFilters } = createPowerSearchConfig([
	{ key: 'title', type: 'string', label: 'Title' },
	{ key: 'year', type: 'number', label: 'Year' },
] as const)

export function PowerSearchDemo() @{
	const [filters, setFilters] = useState<any[]>([])
	const visible = applyFilters(filters, books)

	<View className="power-search-demo gap-4">
		<Heading level={2}>Structured search</Heading>
		<PowerSearch config={config} filters={filters} onChange={(next) => setFilters([...next])} resultCount={visible.length} />
		<View className="gap-2">
			@for (const book of visible; key book.title) {
				<Text>{book.title} ({book.year})</Text>
			}
		</View>
	</View>
}
