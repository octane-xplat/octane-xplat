/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, DateInput, TimeInput, Text, TextInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function DateAutoFocusProbe() {
	const [kind, setKind] = useState<'date' | 'time' | null>('date'), [requested, setRequested] = useState(true), [blocked, setBlocked] = useState(false)
	return <VStack gap={2}>
		<Text>Check initial and newly mounted field focus, late/hidden attachment, keyboard/pointer cancellation, blocked/unblocked state, explicit false-to-true requests and removal before attachment. Verify caret/IME and modal focus separately. The runner synthesizes no native input or focus.</Text>
		<TextInput label="Other editor" placeholder="Keep focus here after cancelling a pending request" />
		<Button label="Mount date field" clickAction={() => setKind('date')} /><Button label="Mount time field" clickAction={() => setKind('time')} />
		<Button label="Remove field" clickAction={() => setKind(null)} /><Button label="Toggle focus request" clickAction={() => setRequested(!requested)} />
		<Button label="Toggle blocked" clickAction={() => setBlocked(!blocked)} />
		{kind === 'date' ? <DateInput id="autofocus-preview" label="Booking date" hasAutoFocus={requested} isDisabled={blocked} /> : kind === 'time' ? <TimeInput id="autofocus-preview" label="Start time" hasAutoFocus={requested} isDisabled={blocked} /> : null}
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('autofocus-preview'))
	ctx.record('qualification', 'fixture mounted only; native attachment/input/notification/focus/caret/IME/modal/AX and packaging remain unqualified')
}
