/** @jsxImportSource @nativescript-community/octane */
/** Compiler-defined test leaves keep native control tests independent of layout. */
import { View } from '../../ui/src/View.tsrx'
export { View }
export { HStack } from '../../ui/src/HStack.tsrx'
export { Text } from '../../ui/src/Text.tsrx'
export { Checkbox as CheckboxInput } from '../../ui/src/Checkbox.tsrx'
export { Pressable } from '../../ui/src/Pressable.tsrx'

export function TextInput() { return <label /> }
export function VirtualList(props: any) {
	return <View>{props.items.map((row: any, index: number) =>
		<View key={row.id}>{props.renderItem(row, index)}</View>)}</View>
}
