/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, DateInput, DateRangeInput, VStack } from '@octane-xplat/ui'
import type { DateRange } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function DateSaveProbe() {
	const [date, setDate] = useState<string | null>('2026-03-05'), [range, setRange] = useState<DateRange | null>(null)
	const [pending, setPending] = useState(false), [message, setMessage] = useState('No pending save')
	const finish = useRef<((fail: boolean) => void) | null>(null)
	const save = () => new Promise<void>((resolve, reject) => {
		setPending(true); setMessage('Save pending')
		finish.current = (fail) => {
			finish.current = null; setPending(false); setMessage(fail ? 'Save failed; parent value retained' : 'Saved')
			if (fail) reject(Error('Manual fixture failure')); else resolve()
		}
	})
	return <VStack gap={2}>
		<label text="Choose a date/range, then try another edit or popup before completing the save. Check blocked focus/blur and failure feedback. The runner synthesizes no OS input, native callbacks or focus." />
		<DateInput id="save-date" label="Arrival" value={date} onChange={setDate} changeAction={save} isLoading={pending} min="2026-03-05" />
		<DateRangeInput label="Stay" value={range} onChange={setRange} changeAction={save} isLoading={pending} maxRangeSpan={14}
			presets={[{ label: 'Short stay', getRange: () => ({ start: '2026-03-06', end: '2026-03-08' }) }]} />
		<Button label="Complete save" clickAction={() => finish.current?.(false)} />
		<Button label="Fail save" clickAction={() => finish.current?.(true)} />
		<label text={message} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('save-date'))
	ctx.record('qualification', 'fixture mounted only; native callbacks/save/blur/focus/IME/popup/AX remain unqualified')
}
