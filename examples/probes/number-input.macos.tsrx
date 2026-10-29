/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Field, NumberInput, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function NumberInputProbe() {
	const [value, setValue] = useState<number | null>(2)
	const [steppers, setSteppers] = useState(true)
	const [mode, setMode] = useState<'accept' | 'hold' | 'local'>('accept')
	const [blocked, setBlocked] = useState<'enabled' | 'disabled' | 'readonly'>('enabled')
	const [shown, setShown] = useState(true)
	const [tight, setTight] = useState(false)
	const [history, setHistory] = useState<string[]>([])
	const record = (entry: string) => setHistory((entries) => [...entries.slice(-11), entry])
	return <VStack gap={2}>
		{shown ? <Field label="Mass" description="Try edit, step and clear in each mode" inputID="mass-field" width={280}
			isDisabled={blocked === 'disabled'} isReadOnly={blocked === 'readonly'}>
			<NumberInput id="mass" defaultValue={2} value={mode === 'local' ? undefined : value}
				onValueChange={(next) => { record(`request:${next}`); if (mode === 'accept') setValue(next) }}
				onClear={() => record('clear')} min={0} max={tight ? 3 : 9} step={tight ? 1 : 0.5}
				units="kg" formatValue={(number) => number.toFixed(1)} hasClear hasNumberSteppers={steppers} />
		</Field> : <Text>Number field removed</Text>}
		<Button label="Accept controlled requests" clickAction={() => setMode('accept')} />
		<Button label="Hold controlled requests" clickAction={() => setMode('hold')} />
		<Button label="Use local value" clickAction={() => setMode('local')} />
		<Button label="Enable field" clickAction={() => setBlocked('enabled')} />
		<Button label="Disable field" clickAction={() => setBlocked('disabled')} />
		<Button label="Make field read-only" clickAction={() => setBlocked('readonly')} />
		<Button label="Toggle numeric bounds and step" clickAction={() => setTight((next) => !next)} />
		<Button label="Remove or remount numeric field" clickAction={() => setShown((next) => !next)} />
		<Button id="toggle-steppers" label="Toggle number steppers" clickAction={() => setSteppers((shown) => !shown)} />
		<Text id="number-state">{value === null ? 'empty' : String(value)}</Text>
		<Text>{`Mode: ${mode}; state: ${blocked}; bounds: 0..${tight ? 3 : 9}`}</Text>
		<Text>{history.join(' → ')}</Text>
	</VStack>
}

// Initial native metadata/handler dispatch only; no OS input or pixels.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('mass-field'))
	ctx.assert('formatted initial value', String(ctx.find('mass-field').stringValue), '2.0')
	await ctx.press('toggle-steppers')
	ctx.record('native field remains after steppers toggle', String(ctx.find('mass-field').stringValue))
}
