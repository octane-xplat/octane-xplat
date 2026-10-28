/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Field, Slider, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function SliderProbe() {
	const [range, setRange] = useState<number | [number, number]>([20, 80])
	return <VStack gap={2}>
		<Slider id="volume" label="Volume" defaultValue={0.5} min={0} max={1} valueDisplay="text" />
		<Slider id="prices" label="Price range" value={range} onValueChange={setRange} min={0} max={100} step={5}
			valueDisplay="text" marks={[{ value: 0, label: 'Low' }, { value: 100, label: 'High' }]} />
		<Field label="Locked" isReadOnly><Slider defaultValue={40} /></Field>
		<Text id="slider-state">{JSON.stringify(range)}</Text>
	</VStack>
}

// Initial metadata only; physical drags, keys, focus and VoiceOver need separate evidence.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('prices-lower'))
	ctx.assert('lower initial value', String(ctx.find('prices-lower').accessibilityValue), '20')
	ctx.assert('upper initial value', String(ctx.find('prices-upper').accessibilityValue), '80')
}
