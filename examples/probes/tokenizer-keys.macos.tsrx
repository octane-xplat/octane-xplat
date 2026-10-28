/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Text, TextInput, Tokenizer, VStack, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
const people = [{ id: 'ada', label: 'Ada' }, { id: 'grace', label: 'Grace' }]
const source = createStaticSource(people)
export default function TokenizerKeysProbe() {
	const [tags, setTags] = useState<SearchableItem[]>(people), [readOnly, setReadOnly] = useState(false), [disabled, setDisabled] = useState(false), [accept, setAccept] = useState(true), [last, setLast] = useState('none')
	return <VStack gap={2}>
		<Text>Type/edit a query, then clear it and press Backspace/repeat. Only empty, unmodified, noncomposing input should remove the last token. Try IME/dead keys and both accepted and rejected controlled changes. Move focus to Apply, then outside; callback-driven focus and embedded-content blur must retain ownership. Inline/layer overflow and native accessibility remain separate qualification work.</Text>
		<TextInput label="Before tags" />
		<Tokenizer id="tokenizer-key-preview" label="People" searchSource={source} value={tags} hasEntriesOnFocus hasClear hasCreate isDisabled={disabled} isReadOnly={readOnly}
			onChange={(items, change) => { setLast(`${change.type}: ${change.item.label}`); if (accept) setTags(items) }}
			endContent={<Button label="Apply" clickAction={() => setLast('Apply pressed')} />} />
		<TextInput label="After tags" />
		<Button label="Restore tags" clickAction={() => setTags(people)} />
		<Button label="Toggle read-only" clickAction={() => setReadOnly(!readOnly)} />
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle controlled acceptance" clickAction={() => setAccept(!accept)} />
		<Text>Last: {last}; accepting: {String(accept)}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('tokenizer-key-preview'))
	ctx.record('qualification', 'mounted only; keys/repeat/IME/editor/blur/focus/overflow/AX and packaging remain unqualified')
}
