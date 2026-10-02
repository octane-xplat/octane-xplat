/** @jsxImportSource @nativescript-community/octane */
import { Selector, MultiSelector, Text, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'

const options = [
	{ value: 'apple', label: 'Apple', group: 'Fruit' },
	{ value: 'banana', label: 'Banana', group: 'Fruit' },
	{ value: 'locked', label: 'Locked', isDisabled: true },
]

export default function SelectProbe() @{
	const [value, setValue] = useState<string | string[] | null>('apple')
	const [values, setValues] = useState<string[]>(['locked'])

	<rootlayout><VStack>
		<Selector id="select-single" label="Fruit" options={options} value={value} onValueChange={setValue} hasClear />
		<MultiSelector id="select-multiple" label="Fruits" options={options} value={values} onValueChange={setValues} hasSelectAll triggerDisplay="count" searchable />
		<Text id="select-value">{String(value)}</Text>
		<Text id="select-values">{values.join(',')}</Text>
	</VStack></rootlayout>
}

export { run } from './select-case'
