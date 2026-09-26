import { useState } from 'octane';
import { View, Row, Text, Pressable, ScrollView } from '@octane-xplat/ui';

type Row_ = { id: string; label: string };

function makeItems(n: number): Row_[] {
	const out: Row_[] = [];
	for (let i = 0; i < n; i++) out.push({ id: 'r' + i, label: 'Row ' + i });
	return out;
}

const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

const INITIAL = makeItems(500);

/** Shared fallback — 500 rows rendered through ScrollView + map (no
 *  recycling in the shared surface; the platform siblings render
 *  UITableView/RecyclerView). Long-list mutation still exercises keyed
 *  reconciliation. */
export function VirtualList() @{
	const [items, setItems] = useState<Row_[]>(INITIAL);

	const shuffle = () => setItems([...items].reverse());
	const prepend = () =>
		setItems([{ id: 'new-' + Date.now(), label: 'Prepended ' + items.length }, ...items]);

	const dropFirst = () => setItems(items.slice(1));

	<View className="vx-app flex-1 gap-4">
		<Row className="gap-4">
			<Pressable id="vl-prepend" onPress={prepend} className="btn btn-secondary">
				<Text>Prepend</Text>
			</Pressable>
			<Pressable id="vl-drop" onPress={dropFirst} className="btn btn-secondary">
				<Text>Drop first</Text>
			</Pressable>
			<Pressable id="vl-shuffle" onPress={shuffle} className="btn btn-secondary">
				<Text>Reverse</Text>
			</Pressable>
		</Row>
		<Text className="text-sm text-muted">{items.length + ' rows · shared (no recycling)'}</Text>
		<ScrollView id="vlist" className="list flex-1">
			{items.map(renderRow)}
		</ScrollView>
	</View>
}
