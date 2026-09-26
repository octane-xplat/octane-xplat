/** @jsxImportSource @nativescript-community/octane */
import { ScrollBox, Text, View } from '@octane-xplat/ui';
import { UITableView } from '@octane-xplat/ui/ios';

type Row_ = { id: string; label: string };

const ITEMS: Row_[] = Array.from({ length: 24 }, (_, index) => ({
	id: 'scrollbox-' + index,
	label: 'ScrollBox row ' + (index + 1),
}));

const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

/** iOS: ScrollBox is the inline (non-scrolling) content shell so the
 *  UITableView inside owns scrolling — the supported replacement for a
 *  platform list nested in ScrollView. */
export function ScrollBoxDemo() @{
	<View className="vx-app flex-1 gap-4">
		<ScrollBox id="scrollbox-demo" className="flex-1">
			<View className="gap-2">
				<UITableView id="scrollbox-demo-list" className="flex-1" items={ITEMS} renderItem={renderRow} />
			</View>
		</ScrollBox>
	</View>
}
