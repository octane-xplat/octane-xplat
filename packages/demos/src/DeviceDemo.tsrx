import { useState } from 'octane';
import {
	Drawer, KeyboardAvoiding, Pressable, Row, SafeArea, Screen, Text, TextInput, View,
	useSafeAreaInsets,
} from '@octane-xplat/ui';

// Drawer slot props take components (not elements) — the universal runtime
// can't materialize element descriptors passed as prop values.
function DrawerMain() @{
	<View className="device-drawer-main"><Text>Drawer main content</Text></View>
}

function DrawerPanel() @{
	<View className="device-drawer-content"><Text>Drawer panel</Text></View>
}

export function DeviceDemo() @{
	const insets = useSafeAreaInsets();
	const [value, setValue] = useState('');
	const [drawerOpen, setDrawerOpen] = useState(false);
	<Screen className="vx-app flex-1">
		<SafeArea className="device-demo flex-1 gap-4">
			<Text className="text-xl font-bold">Device seams</Text>
			<View className="device-safe-sample">
				<View className="device-edge-top"><Text>Top safe edge</Text></View>
				<Text>{`Insets — top ${insets.top}, right ${insets.right}, bottom ${insets.bottom}, left ${insets.left}`}</Text>
				<View className="device-edge-bottom"><Text>Bottom safe edge</Text></View>
			</View>
			<Text>Focus the field to see keyboard handling.</Text>
			<KeyboardAvoiding className="device-keyboard flex-1">
				<TextInput className="input" value={value} placeholder="Type here" onChange={setValue} />
			</KeyboardAvoiding>
			<Row>
				<Pressable className="chip" onPress={() => setDrawerOpen(!drawerOpen)}>
					<Text className="text-onprimary">{drawerOpen ? 'Close drawer' : 'Open drawer'}</Text>
				</Pressable>
			</Row>
			<Drawer
				open={drawerOpen}
				className="device-drawer"
				main={DrawerMain}
				drawer={DrawerPanel}
			/>
			<Text className="device-native-note">Native drawer rides @nativescript-community/ui-drawer (optional peer).</Text>
		</SafeArea>
	</Screen>
}
