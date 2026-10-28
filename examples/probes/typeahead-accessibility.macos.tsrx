/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { BaseTypeahead, Button, Text, TextInput, VStack, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
const source = createStaticSource([{ id: 'ada', label: 'Ada' }, { id: 'grace', label: 'Grace' }])
const replacement = createStaticSource([{ id: 'current', label: 'Current person' }])
export default function TypeaheadAccessibilityProbe() {
	const [person, setPerson] = useState<SearchableItem | null>(null), [blocked, setBlocked] = useState(false), [alternate, setAlternate] = useState(false), [shown, setShown] = useState(true)
	return <VStack gap={2}>
		<Text>Open suggestions with focus or ArrowDown. Inspect combo/list/option names, expanded state and pending selected children as arrows highlight; Enter commits. Keyboard focus should remain in the text editor. Check VoiceOver navigation/announcements, source replacement, blocking, close/reopen and removal. Roles/links are source coverage; actual native AX behavior is unqualified.</Text>
		<TextInput label="Before search" />
		{shown ? <BaseTypeahead id="typeahead-ax-preview" searchSource={alternate ? replacement : source} value={person} onChange={setPerson} hasEntriesOnFocus isReadOnly={blocked} accessibilityLabel="Choose a person" /> : null}
		<TextInput label="After search" />
		<Button label="Toggle read-only" clickAction={() => setBlocked(!blocked)} /><Button label="Replace source" clickAction={() => setAlternate(!alternate)} /><Button label="Toggle search" clickAction={() => setShown(!shown)} />
		<Text>Committed: {person?.label ?? 'none'}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('typeahead-ax-preview'))
	ctx.record('qualification', 'mounted only; native AX hierarchy/navigation/announcements/editor/IME/focus and packaging remain unqualified')
}
