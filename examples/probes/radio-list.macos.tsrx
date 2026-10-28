/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, RadioList, RadioListItem, Text, TextInput, VStack } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function RadioListProbe() {
	const [value, setValue] = useState('free'), [readOnly, setReadOnly] = useState(false), [disabled, setDisabled] = useState(false), [childDisabled, setChildDisabled] = useState(false), [accept, setAccept] = useState(true), [move, setMove] = useState(false), [childValue, setChildValue] = useState('team'), [last, setLast] = useState('none')
	const next = useRef<TextInputHandle | null>(null)
	return <VStack gap={2}>
		<Text>Check options and child selection, current disabled/read-only state, a changed child value, and controlled acceptance/rejection. Use arrows/Home/End and Tab; callback-chosen focus should remain authoritative. Native input, group relationships, layout and accessibility remain unqualified.</Text>
		<RadioList label="Plan" value={value} isDisabled={disabled} isReadOnly={readOnly}
			onValueChange={(selected) => { setLast(selected); if (accept) setValue(selected); if (move) next.current?.focus() }}
			options={[{ value: 'free', label: 'Free', description: 'Personal use' }, { value: 'locked', label: 'Unavailable', isDisabled: true }]}>
			<RadioListItem id="plan-team" value={childValue} label="Team" description="Shared projects" isDisabled={childDisabled} />
		</RadioList>
		<Text id="plan-state">{value}</Text>
		<TextInput label="Other focus owner" ref={next} />
		<RadioList label="Uncontrolled choice" defaultValue="free" options={[{ value: 'free', label: 'Free' }, { value: 'team', label: 'Team' }]} />
		<Button label="Toggle read-only" clickAction={() => setReadOnly(!readOnly)} /><Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle child disabled" clickAction={() => setChildDisabled(!childDisabled)} /><Button label="Change child value" clickAction={() => setChildValue(childValue === 'team' ? 'business' : 'team')} />
		<Button label="Toggle acceptance" clickAction={() => setAccept(!accept)} /><Button label="Toggle focus move" clickAction={() => setMove(!move)} />
		<Text>Last request: {last}; acceptance: {String(accept)}; move focus: {String(move)}</Text>
	</VStack>
}

// Direct native handler/state only: not pointer/keyboard input or VoiceOver.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('plan-team'))
	await ctx.press('plan-team')
	await ctx.waitFor(() => String(ctx.find('plan-state').stringValue) === 'team')
	ctx.assert('child selection accepted', String(ctx.find('plan-state').stringValue), 'team')
}
