import { ScrollView, Text, View } from '@octane-xplat/ui';

type Row_ = { id: string; label: string };

const ITEMS: Row_[] = Array.from({ length: 24 }, (_, index) => ({
	id: 'scrollbox-' + index,
	label: 'ScrollBox row ' + (index + 1),
}));

const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

/** Shared fallback — the shared surface has no recycled List, so the
 *  composed version is ScrollView + mapped rows. Native siblings render
 *  ScrollBox + the platform list owning its own scroll. */
export function ScrollBoxDemo() @{
	<View className="vx-app flex-1 gap-4">
		<ScrollView id="scrollbox-demo" className="flex-1">
			<View className="gap-2">
				{ITEMS.map(renderRow)}
			</View>
		</ScrollView>
	</View>
}
