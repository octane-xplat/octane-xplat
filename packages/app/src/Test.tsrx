import { useState } from 'octane';
import { Screen, ScrollableArea, View, HStack, Text, Pressable, Switch } from '@octane-xplat/ui';
import { DEMOS } from '@xplat/demos';
// './probes-host' is extensionless on purpose: moduleSuffixes resolves the
// .web.ts/.mobile.ts twin — the suffix-resolution seam itself is the probe,
// both leaves now re-export the same shared Probes.
import { Probes } from './probes-host';
import { Services } from './Services.tsrx';
import { openBottomSheet } from './platform/sheet';
import { router } from '@octane-xplat/ui/routing';
import { MediaServices } from './media-services';

/** Test tab — everything that isn't the familiar poke surface: probe
 *  instrumentation, the platform-services catalog, harness seams (switch,
 *  sheet), and the seam-proof demos (push into this tab's own stack). */
export function Test() @{
	const [notifications, setNotifications] = useState(true);
	const [analytics, setAnalytics] = useState(false);
	const proofs = DEMOS.filter((d) => d.kind === 'proof');

	<Screen className="vx-app flex-1 gap-6">
		<ScrollableArea id="test-scroll" className="flex-1">
		<Text className="text-2xl font-semibold">Test</Text>

		<View className="sink-section">
			<Text className="section-label">Human QA</Text>
			<HStack className="demo-menu">
				<Pressable
					id="menu-human-qa"
					onPress={() => router.push({ to: '/qa', stack: 'test' })}
					className="chip"
				>
					<Text>Human checklist →</Text>
				</Pressable>
			</HStack>
		</View>

		<View className="sink-section">
			<Text className="section-label">Navigation seams</Text>
			<HStack className="demo-menu">
				<Pressable
					id="menu-navigation-blocking"
					onPress={() => router.push({ to: '/navigation-blocking', stack: 'test' })}
					className="chip"
				>
					<Text>Unsaved edits →</Text>
				</Pressable>
				<Pressable
					id="menu-broken-render"
					onPress={() => router.push({ to: '/broken', search: { fail: 'render' }, stack: 'test' })}
					className="chip"
				>
					<Text>Route boundary →</Text>
				</Pressable>
				<Pressable
					id="menu-broken-loader"
					onPress={() => router.push({ to: '/broken', search: { fail: 'loader' }, stack: 'test' })}
					className="chip"
				>
					<Text>Loader error →</Text>
				</Pressable>
			</HStack>
		</View>

		<Probes />
		<MediaServices />

		<Text className="section-label">Platform services</Text>
		<Services />

		<View className="sink-section">
			<Text className="section-label">Motion contract</Text>
			<HStack className="demo-menu">
				<Pressable
					id="menu-motion-probe"
					onPress={() => router.push({ to: '/motion-probe', stack: 'test' })}
					className="chip"
				>
					<Text>Motion · device checks</Text>
				</Pressable>
			</HStack>
		</View>

		<View className="sink-section">
			<Text className="section-label">Performance gate</Text>
			<HStack className="demo-menu">
				<Pressable
					id="menu-vlist-perf"
					onPress={() => router.push({ to: '/demo/:id', params: { id: 'vlist-perf' }, stack: 'test' })}
					className="chip"
				>
					<Text>VirtualList · 5,000 rows</Text>
				</Pressable>
			</HStack>
		</View>

		<View className="sink-section">
			<Text className="section-label">Seam proofs</Text>
			<HStack className="demo-menu">
				@for (const d of proofs; key d.id) {
					<Pressable id={'menu-' + d.id} onPress={() => router.push({ to: '/demo/:id', params: { id: d.id }, stack: 'test' })} className="chip">
						<Text>{d.title}</Text>
					</Pressable>
				}
			</HStack>
		</View>

		<View className="sink-section">
			<Text className="section-label">Harness seams</Text>
			<HStack className="setting-row">
				<Text>Notifications</Text>
				<Switch
					id="sw-notifications"
					checked={notifications}
					onCheckedChange={(v) => { console.log('[probe] switch notif -> ' + v); setNotifications(v); }}
				/>
			</HStack>
			<HStack className="setting-row">
				<Text>Analytics</Text>
				<Switch
					checked={analytics}
					onCheckedChange={(v) => { console.log('[probe] switch analytics -> ' + v); setAnalytics(v); }}
				/>
			</HStack>
			{/* onPress passes the tap event — wrap; openBottomSheet's first arg is the
			    content component, not the event. */}
			<Pressable id="sheet-btn" onPress={() => openBottomSheet()} className="btn bg-primary">
				<Text className="text-onprimary">Open sheet</Text>
			</Pressable>
		</View>
		</ScrollableArea>
	</Screen>
}
