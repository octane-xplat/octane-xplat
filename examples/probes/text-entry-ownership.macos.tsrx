/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, SearchInput, Text, TextArea, TextInput, VStack } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function TextEntryOwnershipProbe() {
	const [name, setName] = useState('Ada'), [readOnly, setReadOnly] = useState(false), [disabled, setDisabled] = useState(false), [shown, setShown] = useState(true), [move, setMove] = useState(true), [accept, setAccept] = useState(true), [last, setLast] = useState('none')
	const next = useRef<TextInputHandle | null>(null)
	const [message, setMessage] = useState('Hello'), [query, setQuery] = useState('recent'), [controlled, setControlled] = useState(true)
	const [narrow, setNarrow] = useState(false), [capped, setCapped] = useState(true), [fixed, setFixed] = useState(false)
	const queued = useRef<{ active: boolean; revision: number; timer?: ReturnType<typeof setTimeout> }>({ active: false, revision: 0 })
	useEffect(() => {
		queued.current.active = true
		return () => {
			queued.current.active = false; queued.current.revision++
			const timer = queued.current.timer; queued.current.timer = undefined; clearTimeout(timer)
		}
	}, [])
	const queueReplacement = () => {
		if (!queued.current.active) return
		const revision = ++queued.current.revision
		const previous = queued.current.timer; queued.current.timer = undefined; clearTimeout(previous)
		queued.current.timer = setTimeout(() => {
			if (!queued.current.active || queued.current.revision !== revision) return
			queued.current.timer = undefined
			setName('External name'); setMessage('External message'); setQuery('External query'); setLast('external replacement fired')
		}, 2500)
		setLast('external replacement queued: focus a field and begin composing')
	}
	return <VStack gap={2}>
		<Text>Type/compose, submit and clear. Try accepted/rejected controlled edits, current blocking, clear-to-next focus, and removing/remounting fields. Clear should report change before clear and preserve callback-chosen focus. Check real IME/caret/Return/clear/focus ordering after authorization; this runner only records mounting.</Text>
		{shown ? <VStack gap={2}><TextInput id="text-entry-owner-preview" label="Controlled name" value={controlled ? name : undefined} defaultValue="Ada" hasClear isDisabled={disabled} isReadOnly={readOnly}
			onChange={(text) => { setLast(`change: ${text}`); if (accept) setName(text) }}
			onClear={() => { setLast('clear'); if (move) next.current?.focus() }} onSubmit={() => setLast('name submitted')} />
			<TextArea id="multiline-sizing-owner" label="Controlled message" autoGrow={!fixed} rows={2} maxRows={capped ? 4 : undefined} style={{ width: narrow ? 200 : 360 }} value={controlled ? message : undefined} defaultValue="Hello" onChange={(text) => { if (accept) setMessage(text) }} />
			<SearchInput label="Controlled search" value={controlled ? query : undefined} defaultValue="recent" onChange={(text) => { if (accept) setQuery(text) }} />
		</VStack> : null}
		<TextInput label="Next focus owner" ref={next} />
		<TextArea label="Uncontrolled message" autoGrow={!fixed} rows={2} maxRows={capped ? 4 : undefined} style={{ width: narrow ? 200 : 360 }} defaultValue="Hello" returnKeyType="send" isDisabled={disabled} isReadOnly={readOnly} onSubmit={() => setLast('message submitted')} />
		<SearchInput label="Uncontrolled search" defaultValue="recent" isDisabled={disabled} isReadOnly={readOnly} onSubmit={() => setLast('search submitted')} />
		<Button label="Toggle read-only" clickAction={() => setReadOnly(!readOnly)} /><Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle controlled acceptance" clickAction={() => setAccept(!accept)} /><Button label="Toggle clear focus move" clickAction={() => setMove(!move)} />
		<Button label="Toggle controlled fields" clickAction={() => setShown(!shown)} />
		<Button label="Toggle controlled values" clickAction={() => setControlled(!controlled)} />
		<Button label="Toggle multiline width" clickAction={() => setNarrow(!narrow)} />
		<Button label="Toggle multiline row cap" clickAction={() => setCapped(!capped)} />
		<Button label="Toggle multiline growth" clickAction={() => setFixed(!fixed)} />
		<Text>For multiline sizing, enter several wrapped lines, change width/cap/growth, then remove and remount the controlled fields. Verify native scrolling, height, focus and cleanup manually after authorization; the run hook does not exercise them.</Text>
		<Button label="Queue external replacement in 2.5 seconds" clickAction={queueReplacement} />
		<Text>Queued replacement is a manual trial only. After queuing, focus one controlled field and begin an IME composition; compare commit, matching echo, removal/unset and unmount/remount. Pointer actions can commit composition before changing props. Real editor/selection/notification ordering and memory remain unqualified. No input is automated.</Text>
		<Text>Last: {last}; acceptance: {String(accept)}; move focus: {String(move)}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('text-entry-owner-preview'))
	ctx.record('qualification', 'mounted only; native edits/IME/caret/Return/clear/focus/AX and packaging remain unqualified')
}
