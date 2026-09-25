import { List, ScrollBox, Text, View } from '@octane-xplat/ui';

type Row_ = { id: string; label: string };

const ITEMS: Row_[] = Array.from({ length: 24 }, (_, index) => ({
	id: 'scrollbox-' + index,
	label: 'ScrollBox row ' + (index + 1),
}));

const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

/** Proves the supported replacement for List inside ScrollView. Web uses a
 * scrolling ScrollView; native uses an inline View so ListView owns scrolling. */
export function ScrollBoxDemo() @{
	<View className="vx-app flex-1 gap-4">
		<Text>ScrollBox keeps a nested List portable.</Text>
		<ScrollBox id="scrollbox-demo" className="flex-1">
			<View className="gap-2">
				<Text>Scroll the list below.</Text>
				<List id="scrollbox-demo-list" className="flex-1" items={ITEMS} renderItem={renderRow} />
			</View>
		</ScrollBox>
	</View>
}
