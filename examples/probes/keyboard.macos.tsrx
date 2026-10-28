/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { FocusScope, Text, useKeyboard } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function KeyboardProbe() {
	const [last, setLast] = useState('No key received')
	const [parents, setParents] = useState(0)
	const parent = useKeyboard({ onKeyDown: () => setParents((value) => value + 1) })
	const field = useKeyboard({ onKeyDown: (event) => {
		if (event.isComposing) return
		setLast(`${event.key}/${event.code}/${event.repeat}`)
		if (event.metaKey && event.key.toLowerCase() === 'k') {
			event.preventDefault()
			event.stopPropagation()
		}
	} })
	return <FocusScope contain autoFocus restoreFocus accessibilityLabel="Keyboard probe">
		<masonview {...parent.keyboardProps} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
			<textfield id="keyboard-field" placeholder="Type, Tab, Shift+Tab or Command+K" {...field.keyboardProps} />
			<textfield id="keyboard-next" placeholder="Second Tab stop" />
			<Text id="keyboard-state">{last}</Text>
			<Text id="keyboard-parent-count">{String(parents)}</Text>
			<Text id="keyboard-support">{field.isSupported ? 'available' : 'unavailable'}</Text>
		</masonview>
	</FocusScope>
}

// This fixture exposes state for later physical key/IME/Tab verification.
// No event is synthesized; initial availability is not OS input evidence.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('keyboard-field'))
	ctx.record('key attachment capability', String(ctx.find('keyboard-support')?.stringValue))
	ctx.record('initial key state', String(ctx.find('keyboard-state')?.stringValue))
}
