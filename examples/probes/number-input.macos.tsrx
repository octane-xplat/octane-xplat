/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Field, NumberInput, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function NumberInputProbe() {
	const [value, setValue] = useState<number | null>(2)
	const [steppers, setSteppers] = useState(true)
	return <VStack gap={2}>
		<Field label="Mass" description="Between zero and nine" inputID="mass-field" width={280}>
			<NumberInput id="mass" value={value} onValueChange={setValue} min={0} max={9} step={0.5}
				units="kg" formatValue={(number) => number.toFixed(1)} hasClear hasNumberSteppers={steppers} />
		</Field>
		<Button id="toggle-steppers" label="Toggle number steppers" clickAction={() => setSteppers((shown) => !shown)} />
		<Text id="number-state">{value === null ? 'empty' : String(value)}</Text>
	</VStack>
}

// Initial native metadata/handler dispatch only; no OS input or pixels.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('mass-field'))
	ctx.assert('formatted initial value', String(ctx.find('mass-field').stringValue), '2.0')
	await ctx.press('toggle-steppers')
	ctx.record('native field remains after steppers toggle', String(ctx.find('mass-field').stringValue))
}
