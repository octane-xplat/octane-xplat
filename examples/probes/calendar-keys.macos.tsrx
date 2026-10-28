/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Calendar, VStack } from '@octane-xplat/ui'
import type { DateRange } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function CalendarKeysProbe() {
	const [day, setDay] = useState<string | null>('2026-03-05'), [range, setRange] = useState<DateRange | null>(null)
	const [rtl, setRTL] = useState(false)
	return <VStack gap={2}>
		<label text="Tab into a day; arrows move focus, Home/End use row edges, Command+Home/End use the visible grid, PageUp/PageDown change months. Enter/Space selects. Range Escape clears an unfinished anchor before a surrounding layer handles dismissal. No OS keys are synthesized by the runner." />
		<Button label="Toggle RTL" clickAction={() => setRTL(!rtl)} />
		<Calendar id="calendar-keys" value={day} onChange={setDay}
			direction={rtl ? 'rtl' : 'ltr'} min="2026-01-01" max="2026-12-31" numberOfMonths={2} />
		<Calendar id="range-keys" mode="range" value={range} onChange={setRange} direction={rtl ? 'rtl' : 'ltr'} maxRangeSpan={14} />
		<label text={JSON.stringify({ day, range })} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('calendar-keys'))
	ctx.record('qualification', 'fixture mounted only; physical keys/Tab/focus/popup/AX remain unqualified')
}
