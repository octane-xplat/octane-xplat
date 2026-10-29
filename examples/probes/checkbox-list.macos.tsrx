/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, CheckboxInput, CheckboxList, CheckboxListItem, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function CheckboxListProbe() {
	const [value, setValue] = useState<string[]>([])
	const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate')
	const [disabled, setDisabled] = useState(false), [readonly, setReadonly] = useState(false)
	const [accept, setAccept] = useState(true), [shown, setShown] = useState(true)
	const [removeNext, setRemoveNext] = useState(false), [requests, setRequests] = useState('')
	const history = useRef<string[]>([])
	function record(kind: string, next: boolean) {
		history.current.push(`${kind}:${next}`)
		setRequests(history.current.join(', '))
	}
	return <VStack gap={2}>
		<CheckboxList label="Notifications" value={value} onValueChange={setValue}
			options={[{ value: 'email', label: 'Email', description: 'Daily summary' }]}>
			<CheckboxListItem id="check-alerts" value="alerts" label="Alerts" description="Immediate updates" />
			<CheckboxListItem label="All" isChecked={value.length === 0 ? false : value.length === 2 ? true : 'indeterminate'}
				onCheck={(checked) => setValue(checked ? ['email', 'alerts'] : [])} />
		</CheckboxList>
		<Text id="checks-state">{value.join(',')}</Text>
		<Text>Standalone ownership: try rapid local toggles, blocked state, rejected parent feedback and removal during a change. Physical input is human-operated.</Text>
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<Button label="Toggle parent acceptance" clickAction={() => setAccept(!accept)} />
		<Button label="Toggle controlled attachment" clickAction={() => setShown(!shown)} />
		<Button label="Toggle remove on next change" clickAction={() => setRemoveNext(!removeNext)} />
		<CheckboxInput id="local-check" label="Local mixed seed" defaultValue="indeterminate"
			isDisabled={disabled} isReadOnly={readonly} onChange={next => record('local', next)} />
		{shown ? <CheckboxInput id="owned-check" label="Parent-owned choice" value={checked}
			isDisabled={disabled} isReadOnly={readonly} onChange={next => {
				record('controlled', next)
				if (accept) setChecked(next)
				if (removeNext) setShown(false)
			}} /> : null}
		<Text id="owned-check-state">{`value:${checked}, accept:${accept}, disabled:${disabled}, readonly:${readonly}, remove:${removeNext}`}</Text>
		<Text id="check-requests">{requests}</Text>
	</VStack>
}

// Direct handler/state only: not pointer/keyboard, mixed VoiceOver or pixels.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('check-alerts'))
	await ctx.press('check-alerts')
	await ctx.waitFor(() => String(ctx.find('checks-state').stringValue) === 'alerts')
	ctx.assert('child membership accepted', String(ctx.find('checks-state').stringValue), 'alerts')
}
