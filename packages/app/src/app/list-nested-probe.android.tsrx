/** @jsxImportSource @nativescript-community/octane */
import { ScrollView, Screen, Text } from '@octane-xplat/ui';
import { RecyclerView } from '@octane-xplat/ui/android';

const ITEMS = [{ id: 'nested-probe-row', label: 'nested probe row' }];

export function ListNestedProbe() @{
	<Screen className="vx-app">
		<Text>Nested list error probe</Text>
		<ScrollView id="nested-probe-scroll">
			<RecyclerView
				id="nested-probe-list"
				items={ITEMS}
				renderItem={(item: (typeof ITEMS)[number]) => <Text>{item.label}</Text>}
			/>
		</ScrollView>
	</Screen>
}
