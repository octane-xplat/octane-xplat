import { useState } from 'octane';
import { View, Row, Text, Pressable, List } from '@octane-xplat/ui';

type Row_ = { id: string; label: string };

function makeItems(n: number): Row_[] {
	const out: Row_[] = [];
	for (let i = 0; i < n; i++) out.push({ id: 'r' + i, label: 'Row ' + i });
	return out;
}

// Module-level: identity-stable across renders, per the List leaf contract
// (the memoized listview subtree compares `items` only — a fresh renderItem
// closure each commit would silently never reach recycled cells' props).
const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

const INITIAL = makeItems(500);

/** virtual-list — volume stress on the recycling List.
 *  Proves: 500-row ListView cell recycling + the managed-items splice/refresh
 *  patch under prepend/remove/shuffle; on web, long-scroll rendering of the
 *  same leaf contract. This is the demo that hurts if identity semantics slip. */
export function VirtualList() @{
	const [items, setItems] = useState<Row_[]>(INITIAL);

	const shuffle = () => setItems([...items].reverse());
	const prepend = () =>
		setItems([{ id: 'new-' + Date.now(), label: 'Prepended ' + items.length }, ...items]);

	const dropFirst = () => setItems(items.slice(1));

	<View className="vx-app flex-1 gap-4">
		<Row className="gap-4">
			<Pressable id="vl-prepend" onPress={prepend} className="btn bg-primary">
				<Text className="text-onprimary">Prepend</Text>
			</Pressable>
			<Pressable id="vl-drop" onPress={dropFirst} className="btn bg-primary">
				<Text className="text-onprimary">Drop first</Text>
			</Pressable>
			<Pressable id="vl-shuffle" onPress={shuffle} className="btn bg-primary">
				<Text className="text-onprimary">Reverse</Text>
			</Pressable>
		</Row>
		<Text>{items.length + ' rows'}</Text>
		<List id="vlist" className="list flex-1" items={items} renderItem={renderRow} />
	</View>
}
