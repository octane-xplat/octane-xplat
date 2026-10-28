/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, Text, TextArea, TextInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

/** Manual IME fixture: arm a replacement, then focus a field and compose
 * before its five-second timer fires. This file does not automate OS input. */
export default function ControlledTextProbe() {
	const [shown, setShown] = useState(true)
	const [field, setField] = useState('Single line')
	const [note, setNote] = useState('Multiline note')
	const timers = useRef<Partial<Record<'field' | 'note', ReturnType<typeof setTimeout>>>>({})
	const sequence = useRef(0)
	useEffect(() => () => {
		for (const timer of Object.values(timers.current)) clearTimeout(timer)
		timers.current = {}
	}, [])
	const replaceLater = (target: 'field' | 'note') => {
		clearTimeout(timers.current[target])
		timers.current[target] = setTimeout(() => {
			delete timers.current[target]
			const next = `External ${++sequence.current}`
			if (target === 'field') setField(next)
			else setNote(next)
		}, 5000)
	}
	return <VStack gap={2}>
		<Button label="Remove / restore fields" clickAction={() => setShown((value) => !value)} />
		{shown ? <TextInput id="controlled-field" label="Single-line composition" value={field} onChange={setField} /> : null}
		<Button label="Replace single line in five seconds" clickAction={() => replaceLater('field')} />
		<Text id="controlled-field-state">{field}</Text>
		{shown ? <TextArea id="controlled-note" label="Multiline composition" value={note} onChange={setNote} /> : null}
		<Button label="Replace note in five seconds" clickAction={() => replaceLater('note')} />
		<Text id="controlled-note-state">{note}</Text>
	</VStack>
}

// Initial native metadata only; this cannot prove actual IME or physical input.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('controlled-field') && ctx.find('controlled-note'))
	ctx.record('initial single-line text', String(ctx.find('controlled-field').stringValue))
	ctx.record('initial multiline text', String(ctx.find('controlled-note').string))
}
