import { Absolute, Grid, Screen, Spacer, Stack, Text, View } from '@octane-xplat/ui';

export function LayoutDemo() @{
	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-bold">Layout primitives</Text>
		<Grid rows="*,*" columns="*,*" className="layout-grid">
			<View row={0} col={0} className="layout-cell"><Text>Grid A</Text></View>
			<View row={0} col={1} className="layout-cell"><Text>Grid B</Text></View>
			<View row={1} col={0} colSpan={2} className="layout-cell layout-span"><Text>Spans two columns</Text></View>
		</Grid>
		<Absolute className="layout-absolute-card">
			<Text left={16} top={18} className="layout-absolute-title">Positioned card</Text>
			<Text left={16} top={52} className="layout-badge">NEW</Text>
		</Absolute>
		<Stack className="layout-stack">
			<View className="layout-stack-back" />
			<View className="layout-stack-front"><Text>Later child is on top</Text></View>
		</Stack>
		<View className="layout-footer-column">
			<Text>Spacer pushes this footer down</Text>
			<Spacer />
			<Text className="layout-footer">Footer</Text>
		</View>
	</Screen>
}
