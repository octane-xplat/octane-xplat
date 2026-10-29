/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { keepAwake, useKeepAwake } from '@octane-xplat/platform'
import { Button, Text, View } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

function ReadingRequest(props: { name: string; quiet: boolean }) @{
	useKeepAwake(undefined, { suppressDeactivateWarnings: props.quiet })
	<Text>{`${props.name}: screen request mounted; native acceptance requires Check.`}</Text>
}

export default function KeepAwakeProbe() @{
	const [first, setFirst] = useState(false), [second, setSecond] = useState(false), [quiet, setQuiet] = useState(false)
	const [result, setResult] = useState('Not requested')
	const alive = useRef(true), generation = useRef(0)
	useEffect(() => { alive.current = true; return () => { alive.current = false; generation.current++ } }, [])
	async function check() {
		const own = ++generation.current
		try {
			const available = await keepAwake.isAvailable(), held = await keepAwake.isActivated()
			if (alive.current && generation.current === own) setResult(`Mechanism available: ${available}; token held: ${held}`)
		} catch { if (alive.current && generation.current === own) setResult('Status unavailable') }
	}
	<View className="gap-3">
		<Text>Start either reading screen to request display-sleep prevention. Release both to resume ordinary sleep policy. This is not a system-sleep or lock override; no request starts on mount.</Text>
		<Button label={first ? 'Close first screen' : 'Open first screen'} clickAction={() => setFirst(!first)} />
		<Button label={second ? 'Close second screen' : 'Open second screen'} clickAction={() => setSecond(!second)} />
		<Button label="Change cleanup warning preference" clickAction={() => setQuiet(!quiet)} />
		<Button label="Check" clickAction={check} />
		@if (first) { <ReadingRequest name="First" quiet={quiet} /> }
		@if (second) { <ReadingRequest name="Second" quiet={quiet} /> }
		<Text id="keep-awake-status">{result}</Text>
	</View>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('keep-awake-status'))
	ctx.record('qualification', 'Mounted idle controls only; no power request, status read, native input or physical sleep verification performed')
}
