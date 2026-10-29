/** @jsxImportSource @octane-xplat/jsx */
/** Compiler-defined test leaves keep native control tests independent of layout. */
import { View } from '../../ui/src/components/layout/View.tsrx'
export { View }
export { HStack } from '../../ui/src/components/layout/HStack.tsrx'
export { Text } from '../../ui/src/components/content/Text.tsrx'
export { Checkbox as CheckboxInput } from '../../ui/src/components/forms/Checkbox.tsrx'
export { Pressable } from '../../ui/src/components/actions/Pressable.tsrx'

export function TextInput() {
	return <label />
}

export function VirtualList(props: any) {
	return (
		<View>
			@for (const row of props.items as any[]; index index; key row.id) {
				<View>{props.renderItem(row, index)}</View>
			}
		</View>
	)
}
