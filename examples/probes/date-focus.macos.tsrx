/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, DateInput, TimeInput, DateTimeInput, DateRangeInput, VStack } from '@octane-xplat/ui'
import type { DateRange, TextInputHandle } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function DateFocusProbe() {
	const date = useRef<TextInputHandle | null>(null), time = useRef<TextInputHandle | null>(null)
	const datetime = useRef<TextInputHandle | null>(null), range = useRef<TextInputHandle | null>(null)
	const [d, setD] = useState<string | null>('2026-03-05'), [t, setT] = useState<string | null>('14:30')
	const [dt, setDt] = useState<string | null>('2026-03-05T14:30'), [r, setR] = useState<DateRange | null>(null)
	const [blocked, setBlocked] = useState(false)
	return <VStack gap={2}>
		<label text="Use the buttons to request each field's primary focus. Check DateTimeInput blur from both segments, unrelated editors, draft/IME callbacks, current blocking and popup interactions. The runner synthesizes no native focus or input." />
		<Button label="Toggle read-only" clickAction={() => setBlocked(!blocked)} />
		<DateInput id="focus-date" ref={date} label="Date" value={d} onChange={setD} isReadOnly={blocked} />
		<Button label="Focus date" clickAction={() => date.current?.focus()} />
		<TimeInput ref={time} label="Time" value={t} onChange={setT} isReadOnly={blocked} />
		<Button label="Focus time" clickAction={() => time.current?.focus()} />
		<DateTimeInput ref={datetime} label="Appointment" value={dt} onChange={setDt} isReadOnly={blocked} />
		<Button label="Focus appointment date" clickAction={() => datetime.current?.focus()} />
		<Button label="Blur appointment" clickAction={() => datetime.current?.blur()} />
		<DateRangeInput ref={range} label="Stay" value={r} onChange={setR} isReadOnly={blocked} />
		<Button label="Focus range trigger" clickAction={() => range.current?.focus()} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('focus-date'))
	ctx.record('qualification', 'fixture mounted only; native refs/responders/editor/IME/blur/layer/AX remain unqualified')
}
