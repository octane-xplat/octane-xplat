/** @jsxImportSource @octane-xplat/macos-renderer */
import { Select as Selector } from '../../packages/ui/src/Select.macos.tsrx'
import { Text } from '../../packages/ui/src/Text.macos.tsrx'
import { VStack } from '../../packages/ui/src/VStack.macos.tsrx'
import { useState } from 'octane'

const options = [
	{ value: 'apple', label: 'Apple', group: 'Fruit' },
	{ value: 'banana', label: 'Banana', group: 'Fruit' },
	{ value: 'locked', label: 'Locked', isDisabled: true },
]

export default function SelectProbe() @{
	const [value, setValue] = useState<string | string[] | null>('apple')
	const [values, setValues] = useState<string[]>(['locked'])

	<VStack>
		<Selector id="select-single" label="Fruit" options={options} value={value} onValueChange={setValue} hasClear />
		<Selector multiple id="select-multiple" label="Fruits" options={options} value={values} onValueChange={(next) => setValues(Array.isArray(next) ? next : [])} hasSelectAll triggerDisplay="count" searchable />
		<Text id="select-value">{String(value)}</Text>
		<Text id="select-values">{values.join(',')}</Text>
	</VStack>
}

export { run } from './select-case'
