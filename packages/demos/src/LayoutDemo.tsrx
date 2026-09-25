import { Absolute, Grid, Screen, Spacer, Stack, Text, View } from '@octane-xplat/ui';

export function LayoutDemo() @{
	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-xl font-semibold">Layout primitives</Text>
		<View className="sink-section">
			<Text className="section-label">Grid</Text>
			<Grid rows="*,*" columns="*,*" className="layout-grid">
				<View row={0} col={0} className="layout-cell"><Text>Sidebar</Text></View>
				<View row={0} col={1} className="layout-cell"><Text>Content</Text></View>
				<View row={1} col={0} colSpan={2} className="layout-cell layout-span"><Text>Footer</Text></View>
			</Grid>
		</View>
		<View className="sink-section">
			<Text className="section-label">Absolute</Text>
			<Absolute className="layout-absolute-card">
				<Text left={16} top={18} className="layout-absolute-title">Card</Text>
				<Text left={16} top={52} className="layout-badge">NEW</Text>
			</Absolute>
		</View>
		<View className="sink-section">
			<Text className="section-label">Stack</Text>
			<Stack className="layout-stack">
				<View className="layout-stack-back" />
				<View className="layout-stack-front"><Text>Top layer</Text></View>
			</Stack>
		</View>
		<View className="layout-footer-column sink-section">
			<Text className="section-label">Spacer</Text>
			<Spacer />
			<Text className="layout-footer">Footer</Text>
		</View>
	</Screen>
}
