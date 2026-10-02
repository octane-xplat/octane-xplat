import { useState } from 'octane'
import { Text, View } from '@octane-xplat/ui'
import { SortableList } from '../src/index'

/** Controlled order: drag a row onto another row to commit a reorder. */
export default function SortableExample() {
	const [items, setItems] = useState(['alpha', 'beta', 'gamma'])
	return (
		<View>
			<Text id="dnd-order">{items.join(',')}</Text>
			<SortableList
				items={items}
				onReorder={setItems}
				renderItem={(id) => (
					<View id={`dnd-${id}`} style={{ height: 64, padding: 12 }}>
						<Text>{String(id)}</Text>
					</View>
				)}
			/>
		</View>
	)
}
