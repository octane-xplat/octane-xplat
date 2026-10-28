/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, SearchInput, Text, TextArea, TextInput, VStack } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function TextEntryOwnershipProbe() {
	const [name, setName] = useState('Ada'), [readOnly, setReadOnly] = useState(false), [disabled, setDisabled] = useState(false), [shown, setShown] = useState(true), [move, setMove] = useState(true), [accept, setAccept] = useState(true), [last, setLast] = useState('none')
	const next = useRef<TextInputHandle | null>(null)
	return <VStack gap={2}>
		<Text>Type/compose, submit and clear. Try accepted/rejected controlled edits, current blocking, clear-to-next focus, and removing/remounting fields. Clear should report change before clear and preserve callback-chosen focus. Check real IME/caret/Return/clear/focus ordering after authorization; this runner only records mounting.</Text>
		{shown ? <TextInput id="text-entry-owner-preview" label="Controlled name" value={name} hasClear isDisabled={disabled} isReadOnly={readOnly}
			onChange={(text) => { setLast(`change: ${text}`); if (accept) setName(text) }}
			onClear={() => { setLast('clear'); if (move) next.current?.focus() }} onSubmit={() => setLast('name submitted')} /> : null}
		<TextInput label="Next focus owner" ref={next} />
		<TextArea label="Uncontrolled message" defaultValue="Hello" returnKeyType="send" isDisabled={disabled} isReadOnly={readOnly} onSubmit={() => setLast('message submitted')} />
		<SearchInput label="Uncontrolled search" defaultValue="recent" isDisabled={disabled} isReadOnly={readOnly} onSubmit={() => setLast('search submitted')} />
		<Button label="Toggle read-only" clickAction={() => setReadOnly(!readOnly)} /><Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle controlled acceptance" clickAction={() => setAccept(!accept)} /><Button label="Toggle clear focus move" clickAction={() => setMove(!move)} />
		<Button label="Toggle name field" clickAction={() => setShown(!shown)} />
		<Text>Last: {last}; acceptance: {String(accept)}; move focus: {String(move)}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('text-entry-owner-preview'))
	ctx.record('qualification', 'mounted only; native edits/IME/caret/Return/clear/focus/AX and packaging remain unqualified')
}
