import { useState } from 'octane'
import { View, HStack, Text, Pressable, VirtualList as VirtualListView } from '@octane-xplat/ui'

type Row_ = { id: string; label: string; height: number; type: 'row' }

function makeItems(count: number): Row_[] {
	return Array.from({ length: count }, (_, index) => ({
		id: 'r' + index,
		label: 'Row ' + index,
		height: 36 + (index % 4) * 12,
		type: 'row',
	}))
}

const INITIAL = makeItems(500)
const keyFor = (item: Row_) => item.id
const typeFor = (item: Row_) => item.type
const renderItem = (item: Row_) => <VirtualListRow item={item} />
const renderHeader = () => <Text className="text-sm text-muted">Variable-height rows · tap rows, then reverse</Text>
const renderFooter = () => <Text className="text-sm text-muted">End of 500 rows</Text>
const renderEmpty = () => <Text>No rows</Text>
const renderSeparator = () => <View style={{ height: 1, backgroundColor: '#d1d5db' }} />

function VirtualListRow(props: { item: Row_ }) @{
	const [pressCount, setPressCount] = useState(0)

	<Pressable
		id={'row-' + props.item.id}
		className="px-3"
		style={{ height: props.item.height, justifyContent: 'center' }}
		onPress={() => setPressCount((count) => count + 1)}
	>
		<Text>{props.item.label + ' · ' + pressCount}</Text>
	</Pressable>
}

/** Exercises the shared VirtualList with keyed, variable-height rows and
 *  data changes while keeping the native UITableView/RecyclerView demos in
 *  their platform subpaths. */
export function VirtualList() @{
	const [items, setItems] = useState<Row_[]>(INITIAL)

	const prepend = () => setItems((current) => [
		{ id: 'new-' + Date.now(), label: 'Prepended', height: 68, type: 'row' },
		...current,
	])

	const dropFirst = () => setItems((current) => current.slice(1))
	const reverse = () => setItems((current) => [...current].reverse())
	const growRow = () => setItems((current) => current.map((item) =>
		item.id === 'r15' ? { ...item, height: item.height + 24 } : item,
	))

	const clear = () => setItems([])
	const restore = () => setItems(INITIAL)

	<View className="vx-app flex-1 gap-3">
		<HStack className="gap-2">
			<Pressable id="vl-prepend" onPress={prepend} className="btn btn-secondary"><Text>Prepend</Text></Pressable>
			<Pressable id="vl-drop" onPress={dropFirst} className="btn btn-secondary"><Text>Drop first</Text></Pressable>
			<Pressable id="vl-reverse" onPress={reverse} className="btn btn-secondary"><Text>Reverse</Text></Pressable>
		</HStack>
		<HStack className="gap-2">
			<Pressable id="vl-grow" onPress={growRow} className="btn btn-secondary"><Text>Grow r15</Text></Pressable>
			<Pressable id="vl-clear" onPress={clear} className="btn btn-secondary"><Text>Empty</Text></Pressable>
			<Pressable id="vl-restore" onPress={restore} className="btn btn-secondary"><Text>Restore</Text></Pressable>
		</HStack>
		<Text className="text-sm text-muted">{items.length + ' rows · tap a row to test keyed state'}</Text>
		<VirtualListView
			id="vlist"
			className="list flex-1"
			items={items}
			keyExtractor={keyFor}
			getItemType={typeFor}
			renderItem={renderItem}
			renderHeader={renderHeader}
			renderFooter={renderFooter}
			renderEmpty={renderEmpty}
			renderSeparator={renderSeparator}
		/>
	</View>
}
