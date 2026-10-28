/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { BaseTypeahead, Button, Text, TextInput, VStack, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
const source = createStaticSource([{ id: 'ada', label: 'Ada' }, { id: 'grace', label: 'Grace' }, { id: 'alan', label: 'Alan' }])
export default function TypeaheadKeysProbe() {
	const [selected, setSelected] = useState<SearchableItem | null>(null), [key, setKey] = useState('none'), [blocked, setBlocked] = useState(false), [cancel, setCancel] = useState(false)
	return <VStack gap={2}>
		<Text>Focus the search. Use ArrowDown to offer results, arrows/Home/End to highlight, Enter to select, Escape to close, and Tab/Shift+Tab to leave. Check modified caret/word selection, IME/dead keys, repeat and nested scopes. The input should keep focus while highlighting. Results remain inline and native listbox accessibility is not qualified.</Text>
		<TextInput label="Before search" />
		<BaseTypeahead id="typeahead-key-preview" searchSource={source} value={selected} onChange={setSelected} hasEntriesOnFocus isReadOnly={blocked} accessibilityLabel="Choose a person"
			onKeyDown={(event) => { setKey(event.key); if (cancel && event.key === 'ArrowDown') event.preventDefault() }} />
		<TextInput label="After search" />
		<Button label="Toggle read-only" clickAction={() => setBlocked(!blocked)} /><Button label="Toggle consumer cancellation" clickAction={() => setCancel(!cancel)} />
		<Text>Selected: {selected?.label ?? 'none'}; last key: {key}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('typeahead-key-preview'))
	ctx.record('qualification', 'mounted only; native key/IME/field-editor/repeat/Tab/layer/reveal/AX and packaging remain unqualified')
}
