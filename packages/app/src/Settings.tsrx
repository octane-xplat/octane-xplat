import { useState } from 'octane';
import { Screen, View, Row, Text, Pressable, Switch } from '@xplat/ui';
import { openSheet } from './platform/sheet';

/** Settings tab — exercises Switch (checkedChange echo?) + the sheet seam. */
export function Settings() @{
	const [notifications, setNotifications] = useState(true);
	const [analytics, setAnalytics] = useState(false);
	console.log('[probe] Settings render notif=' + notifications);
	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-bold">Settings</Text>
		<Row className="gap-4">
			<Text>Notifications</Text>
			<Switch
				id="sw-notifications"
				checked={notifications}
				onCheckedChange={(v) => { console.log('[probe] switch notif -> ' + v); setNotifications(v); }}
			/>
		</Row>
		<Row className="gap-4">
			<Text>Analytics</Text>
			<Switch
				checked={analytics}
				onCheckedChange={(v) => { console.log('[probe] switch analytics -> ' + v); setAnalytics(v); }}
			/>
		</Row>
		<Pressable id="sheet-btn" onPress={openSheet} className="btn bg-primary">
			<Text className="text-onprimary">Open sheet</Text>
		</Pressable>
	</Screen>
}
