import { useState } from 'octane';
import { Screen, View, Row, Text, Pressable, Switch } from '@octane-xplat/ui';
import { DEMOS } from '@xplat/demos';
// './probes-host' is extensionless on purpose: moduleSuffixes resolves the
// .web.ts/.native.ts twin, which re-exports the right Probes leaf
// (Hoverable is web-only, so the probe lives in Probes.web.tsrx).
import { Probes } from './probes-host';
import { Services } from './Services.tsrx';
import { openSheet } from './platform/sheet';
import { navigate } from './platform/nav';

/** Test tab — everything that isn't the familiar poke surface: probe
 *  instrumentation, the platform-services catalog, harness seams (switch,
 *  sheet), and the seam-proof demos (push into this tab's own stack). */
export function Test() @{
	const [notifications, setNotifications] = useState(true);
	const [analytics, setAnalytics] = useState(false);
	const proofs = DEMOS.filter((d) => d.kind === 'proof');

	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-2xl font-semibold">Test</Text>

		<Probes />

		<Text className="section-label">Platform services</Text>
		<Services />

		<View className="sink-section">
			<Text className="section-label">Seam proofs</Text>
			<Row className="demo-menu">
				@for (const d of proofs; key d.id) {
					<Pressable id={'menu-' + d.id} onPress={() => navigate('demo/:id', { id: d.id }, { into: 'test' })} className="chip">
						<Text>{d.title}</Text>
					</Pressable>
				}
			</Row>
		</View>

		<View className="sink-section">
			<Text className="section-label">Harness seams</Text>
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
			{/* onPress passes the tap event — wrap; openSheet's first arg is the
			    content component, not the event. */}
			<Pressable id="sheet-btn" onPress={() => openSheet()} className="btn bg-primary">
				<Text className="text-onprimary">Open sheet</Text>
			</Pressable>
		</View>
	</Screen>
}
