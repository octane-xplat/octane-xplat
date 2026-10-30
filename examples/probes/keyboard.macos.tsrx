/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { FocusScope, Text, useKeyboard } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
import { KVK, postKey, hasFocus } from '../../scripts/probe/appkit-input'

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

// CGEvent posts enter the app's real event queue and are routed by
// sendEvent: local monitor, responder chain, field editor, key-view loop.
// This is OS event evidence, though the events are flagged synthetic;
// it is not hardware-key delivery.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('keyboard-field')?.window)
	ctx.record('key attachment capability', String(ctx.find('keyboard-support')?.stringValue))
	ctx.record('initial key state', String(ctx.find('keyboard-state')?.stringValue))
	const field = ctx.find('keyboard-field')
	const next = ctx.find('keyboard-next')

	ctx.assert('focus field', field.window.makeFirstResponder(field), true)

	// Plain key: reaches the field handler and inserts through the editor;
	// it also propagates to the unhandled parent subscription.
	postKey(KVK.A)
	await ctx.waitFor(() => String(ctx.find('keyboard-state')?.stringValue) === 'a/KeyA/false')
	ctx.assert('typed text reaches the editor', String(field.stringValue), 'a')
	ctx.assert('plain key propagates to parent', String(ctx.find('keyboard-parent-count')?.stringValue), '1')

	// Command+K: the field handler preventDefault+stopPropagation suppresses
	// both insertion and parent delivery (monitor returns nil).
	postKey(KVK.K, 1 << 20)
	await ctx.waitFor(() => String(ctx.find('keyboard-state')?.stringValue) === 'k/KeyK/false', { timeout: 2000 })
	ctx.assert('prevented key leaves no text', String(field.stringValue), 'a')
	ctx.assert('stopped key never reaches the parent', String(ctx.find('keyboard-parent-count')?.stringValue), '1')

	// Tab moves through the real key-view loop to the second stop; the
	// unhandled keydown also propagates to the parent (count 2).
	postKey(KVK.Tab)
	await ctx.waitFor(() => hasFocus(next), { timeout: 2000 })
	ctx.assert('Tab propagated while traversing', String(ctx.find('keyboard-parent-count')?.stringValue), '2')
	ctx.record('Tab moved to second stop', hasFocus(next))

	// An unhandled key on the second field inserts and reaches the parent.
	postKey(KVK.K)
	await ctx.waitFor(() => String(next.stringValue) === 'k', { timeout: 2000 })
	ctx.assert('unhandled key propagates to parent', String(ctx.find('keyboard-parent-count')?.stringValue), '3')
	ctx.record('unmodified key inserted', String(next.stringValue))
}
