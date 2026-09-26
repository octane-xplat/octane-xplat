/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import { Text, View } from '@octane-xplat/ui';
import { UITableView } from '@octane-xplat/ui/ios';

type Row_ = { id: string; label: string };

const ITEMS: Row_[] = Array.from({ length: 24 }, (_, index) => ({
	id: 'pull-refresh-' + index,
	label: 'Pull-refresh row ' + (index + 1),
}));

const renderRow = (item: Row_) => <Text className="cell">{item.label}</Text>;

/** iOS pull-to-refresh — the shared refreshing/onRefresh props on the
 *  platform UITableView (UIKit bounce + contentInset dock, self-drawn
 *  indicator). */
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
		<UITableView
			id="pull-refresh-demo"
			className="list flex-1"
			items={ITEMS}
			renderItem={renderRow}
			refreshing={refreshing}
			onRefresh={refresh}
		/>
	</View>
}
