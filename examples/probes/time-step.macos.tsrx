/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, TimeInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function TimeStepProbe() {
	const [time, setTime] = useState<string | null>('14:30:17'), [readonly, setReadonly] = useState(false)
	return <VStack gap={2}>
		<label text="Focus the time field; plain Up/Down requests 15-minute steps. Compare seconds, bounds, typed/invalid drafts, clearing, read-only, modified keys and IME. The runner synthesizes no native input." />
		<Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<TimeInput id="time-step" label="Start time" value={time} onChange={setTime} increment={15} hasSeconds hasClear
			min="09:00:00" max="17:00:00" hourFormat="24h" isReadOnly={readonly} />
		<label text={time ?? 'No time'} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('time-step'))
	ctx.record('qualification', 'fixture mounted only; physical stepping/repeat/IME/draft/focus/AX remain unqualified')
}
