/** @jsxImportSource @nativescript-community/octane */
import { Text, View } from '@octane-xplat/ui';
import { RecyclerView } from '@octane-xplat/ui/android';

type Row_ = { id: string; label: string };

const ITEMS: Row_[] = Array.from({ length: 24 }, (_, index) => ({
	id: 'scrollbox-' + index,
	label: 'ScrollableArea row ' + (index + 1),
}));

const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

/** Android: the platform list owns scrolling — the shared ScrollableArea
 *  RecyclerView inside owns scrolling — the supported replacement for a
 *  version wraps the content. */
export function ScrollBoxDemo() @{
	<View className="vx-app flex-1 gap-4">
		<View id="scrollbox-demo" className="flex-1">
			<View className="gap-2">
				<RecyclerView id="scrollbox-demo-list" className="flex-1" items={ITEMS} renderItem={renderRow} />
			</View>
		</View>
	</View>
}
