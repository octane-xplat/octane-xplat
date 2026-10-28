/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, DateTimeInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function PresetTimesProbe() {
	const [value, setValue] = useState<string | null>('2026-03-05T14:30'), [readonly, setReadonly] = useState(false)
	return <VStack gap={2}>
		<label text="Focus the closed time field; plain Up/Down requests 5-minute steps, while Alt+Down opens 15-minute presets. Use bounded Up/Down, Home/End and Enter/Space. Tab/Shift-Tab requests a field neighbor; Escape requests field return. Compare clock-button selection, updated bounds and read-only state. No OS keys or native focus are synthesized by the runner." />
		<Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<DateTimeInput id="preset-appointment" label="Appointment" value={value} onChange={setValue} isReadOnly={readonly}
			min="2026-03-05T09:00" max="2026-03-05T17:00" timeIncrement={5} timeOptionInterval={15} hourFormat="24h" />
		<label text={value ?? 'No appointment'} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('preset-appointment-time'))
	ctx.record('qualification', 'fixture mounted only; native closed-field steps/Alt+Down/option keys/Tab/return/scroll/AX remain unqualified')
}
