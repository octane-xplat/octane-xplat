/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, Field, Slider, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function SliderProbe() {
	const [range, setRange] = useState<number | [number, number]>([20, 80])
	const [locked, setLocked] = useState(false)
	const replacement = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	useEffect(() => () => { if (replacement.current !== undefined) clearTimeout(replacement.current) }, [])
	const replaceLater = () => {
		if (replacement.current !== undefined) clearTimeout(replacement.current)
		replacement.current = setTimeout(() => { replacement.current = undefined; setRange([10, 90]) }, 3000)
	}
	return <VStack gap={2}>
		<Slider id="volume" label="Volume" defaultValue={0.5} min={0} max={1} valueDisplay="text" />
		<Slider id="prices" label="Price range" value={range} onValueChange={setRange} isReadOnly={locked} min={0} max={100} step={5}
			valueDisplay="text" marks={[{ value: 0, label: 'Low' }, { value: 100, label: 'High' }]} />
		<Button label="Replace range in three seconds" clickAction={replaceLater} />
		<Text>Arm replacement, then drag across the timer: an external range should retire that drag; start a new drag to continue.</Text>
		<Button label="Toggle range read-only" clickAction={() => setLocked((value) => !value)} />
		<Text>Try keys and accessibility adjustments before and after locking. Initial metadata does not qualify native input.</Text>
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
