/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import {
	Drawer, KeyboardAvoiding, Pressable, Row, SafeArea, Screen, Text, TextInput, View,
	useSafeAreaInsets,
} from '@octane-xplat/ui';

/** Native leaf — KeyboardAvoiding is native-only (it's an inert div on
 *  web, so it left the shared surface). The shared `DeviceDemo.tsrx`
 *  fallback covers web. */
export function DeviceDemo() @{
	const insets = useSafeAreaInsets();
	const [value, setValue] = useState('');
	const [drawerOpen, setDrawerOpen] = useState(false);

	<Screen className="vx-app flex-1">
		<SafeArea className="device-demo flex-1 gap-6">
			<Text className="text-xl font-semibold">Device seams</Text>
			<View className="sink-section flex-1">
				<Text className="section-label">Safe-area insets</Text>
				<View className="device-safe-sample">
					<View className="device-edge-top"><Text>Top safe edge</Text></View>
					<Text className="text-sm text-muted">{`top ${insets.top} · right ${insets.right} · bottom ${insets.bottom} · left ${insets.left}`}</Text>
					<View className="device-edge-bottom"><Text>Bottom safe edge</Text></View>
				</View>
			</View>
			<View className="sink-section">
				<Text className="section-label">Keyboard avoiding</Text>
				<KeyboardAvoiding className="device-keyboard">
					<TextInput className="input" value={value} placeholder="Type here" onChange={setValue} />
				</KeyboardAvoiding>
			</View>
			<View className="sink-section">
				<Text className="section-label">Drawer</Text>
				<Row>
					<Pressable className="btn btn-secondary" onPress={() => setDrawerOpen(!drawerOpen)}>
						<Text>{drawerOpen ? 'Close drawer' : 'Open drawer'}</Text>
					</Pressable>
				</Row>
				<Drawer
					open={drawerOpen}
					onDismiss={() => setDrawerOpen(false)}
					className="device-drawer"
					main={<View className="device-drawer-main"><Text>Main content</Text></View>}
					drawer={<View className="device-drawer-content"><Text>Drawer panel</Text></View>}
				/>
			</View>
		</SafeArea>
	</Screen>
}
