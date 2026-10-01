import { Absolute, AspectRatio, Center, Grid, Screen, Section, Spacer, Stack, Text, View } from '@octane-xplat/ui';

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
			<Text className="section-label">Stack (flow) / Absolute (overlap)</Text>
			<Stack direction="horizontal" gap={2} className="layout-stack-flow">
				<View className="layout-flow-cell" />
				<View className="layout-flow-cell" />
				<View className="layout-flow-cell" />
			</Stack>
			<Absolute className="layout-stack">
				<View className="layout-stack-back" />
				<View className="layout-stack-front"><Text>Top layer</Text></View>
			</Absolute>
		</View>
		<Section variant="muted" padding={2} dividers={['bottom']} className="sink-section">
			<Text className="section-label">Section and Center</Text>
			<Center axis="both" style={{ minHeight: 48 }}>
				<Text>Centered content</Text>
			</Center>
			<AspectRatio ratio={16 / 9} className="layout-ratio">
				<View className="layout-flow-cell" />
			</AspectRatio>
		</Section>
		<View className="layout-footer-column sink-section">
			<Text className="section-label">Spacer</Text>
			<Spacer />
			<Text className="layout-footer">Footer</Text>
		</View>
	</Screen>
}
