/** @jsxImportSource @octane-xplat/jsx */
import { View, Text, TextArea } from '@octane-xplat/ui'
import { FormField } from '../../../../ui/src/components/forms/FormField'
import type { TextAreaProps, TextInputHandle } from '../../../../ui/src/props'
export const areaRef: { current: TextInputHandle | null } = { current: null }
export function TextAreaHarness(props: TextAreaProps & { frameClass?: string; customIcon?: boolean }) @{
	const { frameClass, customIcon, ...controlProps } = props
	<View className={frameClass} style={{ width: 300, height: 850 }}>
		<TextArea {...controlProps} startIcon={customIcon ? <Text testID="area-custom-icon">✦</Text> : controlProps.startIcon} id="area" ref={areaRef} />
	</View>
}

export const standaloneChanges: string[] = []
export const standaloneRef: { current: any } = { current: null }
export function StandaloneEditor(props: {
	generation: number; width?: number; height?: number; content?: string; left?: number; top?: number; translateX?: number; opacity?: number; role?: 'text';
}) @{
	<proxyviewcontainer>
		<textview key={props.generation} id="standalone-editor" ref={standaloneRef}
			accessibilityRole={props.role}
			onTextChange={(event: any) => standaloneChanges.push(props.generation + ':' + event.value)}
			text={props.content ?? 'First\nSecond'} style={{ width: props.width, height: props.height,
				left: props.left, top: props.top, translateX: props.translateX, opacity: props.opacity, padding: 0, borderWidth: 0 }} />
	</proxyviewcontainer>
}

export function NestedAreaHarness(props: { childLabel?: string }) @{
	<View style={{ width: 300, height: 850 }}>
		<FormField label="Outer notes" inputID="area" width="80%" isRequired isReadOnly isLoading size="sm">
			<TextArea id="area" testID="nested-automation" ref={areaRef} label={props.childLabel} width="50%"
				defaultValue="Nested" style={{ fontSize: 26, padding: 0, borderWidth: 0 }} />
		</FormField>
		<textview id="outside-area" text="Outside" style={{ width: 100, height: 60 }} />
	</View>
}
