/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, DateTimeInput, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function DateTimeDraftProbe() {
	const [value, setValue] = useState<string | null>('2026-03-05T14:30'), [readonly, setReadonly] = useState(false), [mounted, setMounted] = useState(true), [seconds, setSeconds] = useState(false)
	const release = useRef<(() => void) | null>(null), [last, setLast] = useState('none')
	return <VStack gap={2}>
		<Text>Compare date/time drafts, IME confirmation, Return/blur, clear, pending saves and parent corrections. Finish save releases each accepted request. Also start empty, enter a time before the date, then clear it. Check picker/keyboard/save interaction separately. The runner synthesizes no OS events.</Text>
		{mounted ? <DateTimeInput id="datetime-draft-preview" label="Appointment" value={value} onChange={(next) => { setLast(next ?? 'empty'); setValue(next) }} hasSeconds={seconds} hasClear isReadOnly={readonly} timeOptionInterval={15}
			changeAction={() => new Promise<void>((resolve) => { release.current = resolve })} /> : null}
		<Button label="Finish save" clickAction={() => { release.current?.(); release.current = null }} /><Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<Button label="Toggle seconds" clickAction={() => setSeconds(!seconds)} /><Button label="Toggle mounted" clickAction={() => setMounted(!mounted)} />
		<Button label="Parent correction" clickAction={() => setValue('2026-03-09T10:00')} /><Button label="Start empty" clickAction={() => setValue(null)} />
		<Text>Parent: {value ?? 'empty'}; last request: {last}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('datetime-draft-preview'))
	ctx.record('qualification', 'mounted only; native date/time drafts/editor/IME/Return/blur/save/pickers/focus/AX and packaging remain unqualified')
}
