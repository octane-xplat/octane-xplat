/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, TimeInput, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function TimeDraftProbe() {
	const [value, setValue] = useState<string | null>('14:30'), [readonly, setReadonly] = useState(false), [mounted, setMounted] = useState(true)
	const [seconds, setSeconds] = useState(false), [last, setLast] = useState('none'), release = useRef<(() => void) | null>(null)
	return <VStack gap={2}>
		<Text>Type a draft, confirm IME candidates, then compare Return and blur. Each accepted edit holds a save until Finish save. Check busy/read-only draft preservation, clear, seconds, parent correction and removal. The runner does not synthesize input or qualify native editor/IME timing.</Text>
		{mounted ? <TimeInput id="time-draft-preview" label="Start time" value={value} hasClear hasSeconds={seconds} isReadOnly={readonly}
			onChange={(next) => { setLast(next ?? 'empty'); setValue(next) }} changeAction={() => new Promise<void>((resolve) => { release.current = resolve })} /> : null}
		<Button label="Finish save" clickAction={() => { release.current?.(); release.current = null }} /><Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<Button label="Toggle seconds" clickAction={() => setSeconds(!seconds)} /><Button label="Toggle mounted" clickAction={() => setMounted(!mounted)} />
		<Button label="Parent correction to 10:00" clickAction={() => setValue('10:00')} /><Text>Parent value: {value ?? 'empty'}; last request: {last}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('time-draft-preview'))
	ctx.record('qualification', 'mounted only; native drafts/marked text/Return/blur/save ordering/caret/focus/AX and packaging remain unqualified')
}
