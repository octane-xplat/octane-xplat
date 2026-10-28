/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Text, TextArea, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function TextLimitProbe() {
	const [latest, setLatest] = useState('abcd')
	return <VStack>
		<TextArea id="limited-note" label="Five UTF-16 units" defaultValue="abcd" maxLength={5} onChange={setLatest} />
		<Text id="limited-echo">{latest}</Text>
	</VStack>
}

// Native API dispatch only: this does not prove physical keyboard/IME or undo.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('limited-note'))
	const view = ctx.find('limited-note')
	view.insertTextReplacementRange('XYZ', { location: 2, length: 0 })
	await ctx.waitFor(() => String(view.string) === 'abXcd')
	ctx.assert('bounded middle insertion', String(view.string), 'abXcd')
	view.setMarkedTextSelectedRangeReplacementRange('候補編集中', { location: 5, length: 0 }, { location: 1, length: 3 })
	ctx.assert('marked text is not truncated', String(view.string), 'a候補編集中d')
	view.unmarkText()
	await ctx.waitFor(() => String(view.string) === 'a候補編d')
	await ctx.waitFor(() => ctx.find('limited-echo')?.stringValue === 'a候補編d')
	ctx.record('committed native text and onChange agree', String(view.string))
}
