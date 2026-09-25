import { useState } from 'octane';
import { Screen, View, Row, Text, Pressable, Switch } from '@octane-xplat/ui';
import { openSheet } from './platform/sheet';

/** Settings tab — exercises Switch (checkedChange echo?) + the sheet seam. */
export function Settings() @{
	const [notifications, setNotifications] = useState(true);
	const [analytics, setAnalytics] = useState(false);
	console.log('[probe] Settings render notif=' + notifications);

	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-2xl font-semibold">Settings</Text>
		<View className="sink-section">
			<Row className="setting-row">
				<Text>Notifications</Text>
				<Switch
					id="sw-notifications"
					checked={notifications}
					onCheckedChange={(v) => { console.log('[probe] switch notif -> ' + v); setNotifications(v); }}
				/>
			</Row>
			<Row className="setting-row">
				<Text>Analytics</Text>
				<Switch
					checked={analytics}
					onCheckedChange={(v) => { console.log('[probe] switch analytics -> ' + v); setAnalytics(v); }}
				/>
			</Row>
		</View>
		{/* onPress passes the tap event — wrap; openSheet's first arg is the
		    content component, not the event. */}
		<Pressable id="sheet-btn" onPress={() => openSheet()} className="btn bg-primary">
			<Text className="text-onprimary">Open sheet</Text>
		</Pressable>
	</Screen>
}
