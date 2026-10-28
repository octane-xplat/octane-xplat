/** @jsxImportSource @octane-xplat/jsx */
import { View } from '@octane-xplat/ui'
import { TextArea } from '../../../../ui/src/TextArea'
import type { TextAreaProps, TextInputHandle } from '../../../../ui/src/props'
export const areaRef: { current: TextInputHandle | null } = { current: null }
export function TextAreaHarness(props: TextAreaProps & { frameClass?: string }) @{
	const { frameClass, ...controlProps } = props
	<View className={frameClass} style={{ width: 300, height: 850 }}>
		<TextArea {...controlProps} id="area" ref={areaRef} />
	</View>
}
