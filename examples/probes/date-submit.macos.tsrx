/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { DateInput, TimeInput, DateTimeInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function DateSubmitProbe() {
	const [date, setDate] = useState<string | null>('2026-03-05')
	const [time, setTime] = useState<string | null>('14:30')
	const [datetime, setDatetime] = useState<string | null>('2026-03-05T14:30')
	return <VStack gap={2}>
		<label text="Edit each typed segment and press Return; compare blur. Check valid/invalid/empty drafts and IME confirmation. This fixture synthesizes no OS input and does not qualify physical Return or focus behavior." />
		<DateInput id="date-return" label="Date" value={date} onChange={setDate} />
		<TimeInput id="time-return" label="Time" value={time} onChange={setTime} />
		<DateTimeInput id="datetime-return" label="Date and time" value={datetime} onChange={setDatetime} />
		<label text={JSON.stringify({ date, time, datetime })} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('date-return'))
	ctx.record('qualification', 'fixture mounted only; native Return/IME/draft/validation/focus/AX remain unqualified')
}
