/** @jsxImportSource @nativescript-community/octane */
import { ScrollBox, Text, View } from '@octane-xplat/ui';
import { RecyclerView } from '@octane-xplat/ui/android';

type Row_ = { id: string; label: string };

const ITEMS: Row_[] = Array.from({ length: 24 }, (_, index) => ({
	id: 'scrollbox-' + index,
	label: 'ScrollBox row ' + (index + 1),
}));

const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

/** Android: ScrollBox is the inline (non-scrolling) content shell so the
 *  RecyclerView inside owns scrolling — the supported replacement for a
 *  platform list nested in ScrollView. */
export function ScrollBoxDemo() @{
	<View className="vx-app flex-1 gap-4">
		<ScrollBox id="scrollbox-demo" className="flex-1">
			<View className="gap-2">
				<RecyclerView id="scrollbox-demo-list" className="flex-1" items={ITEMS} renderItem={renderRow} />
			</View>
		</ScrollBox>
	</View>
}
