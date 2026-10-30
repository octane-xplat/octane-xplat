/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, Switch, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
import { axAttr } from '../../scripts/probe/appkit-input'

export default function SwitchProbe() {
	const [compact, setCompact] = useState(false)
	const [disabled, setDisabled] = useState(false), [readonly, setReadonly] = useState(false)
	const [fail, setFail] = useState(false), [accept, setAccept] = useState(true)
	const [value, setValue] = useState(false), [requests, setRequests] = useState('')
	const history = useRef<string[]>([])
	function record(kind: string, next: boolean) {
		history.current.push(`${kind}:${next}`)
		setRequests(history.current.join(', '))
	}
	return <VStack gap={2}>
		<Text>Try rapid local toggles, failed saves and rejected parent requests. All activation is human-operated; failure settles in a microtask, without a timer.</Text>
		<Switch id="alerts" label="Alerts" description="Daily summary" defaultValue width={280}
			isDisabled={disabled} isReadOnly={readonly} onChange={next => record('local', next)}
			size={compact ? 'sm' : 'md'} labelPosition={compact ? 'start' : 'end'} labelSpacing="spread"
			status={compact ? { type: 'error', message: 'Try saving again' } : undefined} />
		<Button id="switch-layout" label="Change switch metadata" clickAction={() => setCompact((value) => !value)} />
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<Button label="Toggle save failure" clickAction={() => setFail(!fail)} />
		<Button label="Toggle parent acceptance" clickAction={() => setAccept(!accept)} />
		<Switch id="saved-alerts" label="Saved preference" defaultValue={false}
			isDisabled={disabled} isReadOnly={readonly} onChange={next => record('save', next)}
			changeAction={async () => { if (fail) throw Error('fixture save failure') }} />
		<Switch id="controlled-alerts" label="Parent-owned preference" value={value}
			isDisabled={disabled} isReadOnly={readonly} onChange={next => { record('controlled', next); if (accept) setValue(next) }} />
		<Text id="switch-settings">{`value:${value}, accept:${accept}, fail:${fail}, disabled:${disabled}, readonly:${readonly}`}</Text>
		<Text id="switch-requests">{requests}</Text>
	</VStack>
}

// Initial metadata and direct handler dispatch only, not OS input/focus or pixels.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('alerts'))
	ctx.assert('switch name', String(axAttr(ctx.find('alerts'), 'accessibilityLabel')), 'Alerts')
	await ctx.press('switch-layout')
	ctx.record('name after metadata update', String(axAttr(ctx.find('alerts'), 'accessibilityLabel')))
}
