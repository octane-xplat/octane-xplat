/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Text, useFocusWithin } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function FocusWithinProbe() {
	const [entries, setEntries] = useState(0)
	const [exits, setExits] = useState(0)
	const within = useFocusWithin({
		onFocusWithin: () => setEntries((value) => value + 1),
		onBlurWithin: () => setExits((value) => value + 1),
	})
	return <masonview style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
		<masonview {...within.focusWithinProps} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
			<textfield id="within-first" placeholder="First field in group" />
			<textfield id="within-second" placeholder="Second field in group" />
		</masonview>
		<textfield id="within-outside" placeholder="Outside group" />
		<Text id="within-counts">{`${entries}/${exits}`}</Text>
		<Text id="within-support">{String(within.isSubtreeTrackingSupported)}</Text>
	</masonview>
}

// Programmatic responder changes only; this does not establish physical Tab,
// hit testing, activation, input-method or VoiceOver behavior.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('within-first')?.window)
	ctx.assert('bridge available', ctx.find('within-support')?.stringValue, 'true')
	const first = ctx.find('within-first')
	const focus = (id: string) => ctx.assert(`focus ${id}`, first.window.makeFirstResponder(ctx.find(id)), true)
	focus('within-outside')
	await ctx.waitFor(() => String(ctx.find('within-counts')?.stringValue).split('/')[0] === String(ctx.find('within-counts')?.stringValue).split('/')[1])
	const baseline = String(ctx.find('within-counts')?.stringValue).split('/').map(Number)
	focus('within-first')
	await ctx.waitFor(() => ctx.find('within-counts')?.stringValue === `${baseline[0] + 1}/${baseline[1]}`)
	focus('within-second')
	await ctx.waitFor(() => {
		const editor = ctx.find('within-second')?.currentEditor
		return first.window.firstResponder === ctx.find('within-second') ||
			(typeof editor === 'function' ? editor.call(ctx.find('within-second')) : editor) === first.window.firstResponder
	})
	focus('within-outside')
	await ctx.waitFor(() => ctx.find('within-counts')?.stringValue === `${baseline[0] + 1}/${baseline[1] + 1}`)
	ctx.record('boundary counts', ctx.find('within-counts')?.stringValue)
}
