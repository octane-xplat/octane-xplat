/** @jsxImportSource @octane-xplat/jsx */
import { View, Text, SelectorOption } from '@octane-xplat/ui'
import type { SelectorOptionProps } from '@octane-xplat/ui'

export function SelectorOptionScene(props: SelectorOptionProps & { showIcon?: boolean; iconText?: string }) @{
	<View style={{ width: 320, height: 240 }}>
		<SelectorOption {...props} icon={props.showIcon ? <Text className="selector-part-glyph" style={{ width: 20, height: 20 }}>{props.iconText ?? '+'}</Text> : undefined} />
	</View>
}
