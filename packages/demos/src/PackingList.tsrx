/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { View, Text, Pressable, SearchInput } from '@octane-xplat/ui'

const ITEMS = [
	{ id: 'water', name: 'Water bottle' },
	{ id: 'jacket', name: 'Rain jacket' },
	{ id: 'snack', name: 'Trail snack' },
	{ id: 'map', name: 'Paper map' },
]

/** Bundled local data; completion and search live only in this mounted demo. */
export function PackingList() @{
	const [query, setQuery] = useState('')
	const [packed, setPacked] = useState<string[]>([])
	const visible = ITEMS.filter((item) =>
		item.name.toLowerCase().includes(query.trim().toLowerCase()),
	)

	const toggle = (id: string) =>
		setPacked(packed.includes(id) ? packed.filter((value) => value !== id) : [...packed, id])

	<View className="gap-4">
		<Text className="text-xl font-semibold">Pack for a day outside</Text>
		<SearchInput
			testID="packing-search"
			label="Find a packing item"
			value={query}
			onChange={setQuery}
			onClear={() => setQuery('')}
			placeholder="Try water"
		/>
		<Text accessibilityLiveRegion="polite">{`${packed.length} of 4 items packed; ${visible.length} shown`}</Text>
		@for (const item of visible; key item.id) {
			<Pressable
				id={'pack-' + item.id}
				className="btn btn-secondary"
				onPress={() => toggle(item.id)}
			>
				<Text>{`${packed.includes(item.id) ? 'Packed' : 'Pack'}: ${item.name}`}</Text>
			</Pressable>
		} @empty {
			<Text>No matching items. Clear the search to see your list.</Text>
		}
		<Pressable
			id="packing-reset"
			className="btn btn-secondary"
			onPress={() => {
				setQuery('')
				setPacked([])
			}}
		>
			<Text>Reset packing list</Text>
		</Pressable>
	</View>
}
