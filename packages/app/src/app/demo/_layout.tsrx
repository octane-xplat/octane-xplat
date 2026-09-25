import { Text, View } from '@octane-xplat/ui';

/** Nested route-dir layout — wraps every screen pushed under demo/*
 *  (demo/:id here): web outlets wrap the resolved element, native wraps
 *  the pushed Page's root component. The banner proves the wrap. */
export function DemoLayout(props: { children?: any }) @{
	<View className="demo-layout">
		<Text className="demo-layout-banner">demo layout</Text>
		{props.children}
	</View>
}
