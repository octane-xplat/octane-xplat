/** @jsxImportSource @octane-xplat/jsx */
import { View, Text } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'

export function BoxModelScene(props: { box: ViewProps['style']; leaf: ViewProps['style']; direction?: 'ltr' | 'rtl' }) @{
	<View style={{ width: 320, height: 260 }}>
		<View className="box-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 8, width: 300, height: 120, direction: props.direction }}>
			<View className="box-first" style={props.box}>
				<View className="box-content" style={{ width: 20, height: 10 }} />
			</View>
			<Text className="box-leaf" style={props.leaf}>Label</Text>
			<View className="box-last" style={{ width: 20, height: 20 }} />
		</View>
	</View>
}
