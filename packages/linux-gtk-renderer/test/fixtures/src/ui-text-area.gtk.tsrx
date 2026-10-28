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

export const standaloneChanges: string[] = []
export const standaloneRef: { current: any } = { current: null }
export function StandaloneEditor(props: {
	generation: number; width: number; height: number; left?: number; top?: number; translateX?: number; opacity?: number; role?: 'text';
}) @{
	<proxyviewcontainer>
		<textview key={props.generation} id="standalone-editor" ref={standaloneRef}
			accessibilityRole={props.role}
			onTextChange={(event: any) => standaloneChanges.push(props.generation + ':' + event.value)}
			text={'First\nSecond'} style={{ width: props.width, height: props.height,
				left: props.left, top: props.top, translateX: props.translateX, opacity: props.opacity, padding: 0, borderWidth: 0 }} />
	</proxyviewcontainer>
}
