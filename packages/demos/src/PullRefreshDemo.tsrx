import { useState } from 'octane';
import { ScrollableArea, Text, View } from '@octane-xplat/ui';

type Row_ = { id: string; label: string };

const ITEMS: Row_[] = Array.from({ length: 24 }, (_, index) => ({
	id: 'pull-refresh-' + index,
	label: 'Pull-refresh row ' + (index + 1),
}));

const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

/** Shared pull-to-refresh — `refreshing`/`onRefresh` on ScrollableArea drive
 *  the self-drawn indicator strip on every target. Platform siblings demo
 *  the same props on UITableView/RecyclerView. */
export function PullRefreshDemo() @{
	const [refreshing, setRefreshing] = useState(false);
	const [stamp, setStamp] = useState('never');
	const refresh = () => {
		setRefreshing(true);
		setTimeout(() => {
			setStamp(new Date().toLocaleTimeString());
			setRefreshing(false);
		}, 1200);
	};

	<View className="vx-app flex-1 gap-4">
		<Text>{'Last refresh: ' + stamp}</Text>
		<ScrollableArea
			id="pull-refresh-demo"
			className="flex-1"
			refreshing={refreshing}
			onRefresh={refresh}
		>
			<View className="gap-2">
				{ITEMS.map(renderRow)}
			</View>
		</ScrollableArea>
	</View>
}
