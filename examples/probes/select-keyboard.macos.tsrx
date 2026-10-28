/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { MultiSelector, Selector, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const options = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'apricot', label: 'Apricot' },
	{ value: 'banana', label: 'Banana', isDisabled: true },
	{ value: 'cherry', label: 'Cherry' },
]
export default function SelectKeyboardProbe() {
	const [fruit, setFruit] = useState<string | null>('apple')
	const [many, setMany] = useState<string[]>(['apple'])
	return <VStack gap={2}>
		<label text="Use arrows, Home/End, Enter/Space, Escape and Tab. Search preserves text-editing keys." />
		<Selector id="select-keys" testID="fruit.keyboard" label="Fruit" description="Choose using the keyboard" options={options} value={fruit} onValueChange={setFruit} />
		<MultiSelector id="select-search-keys" label="Fruit collection" options={options} value={many}
			onValueChange={setMany} searchable hasSelectAll />
		<label id="select-key-result" text={`${fruit ?? 'none'}; ${many.join(', ')}`} />
	</VStack>
}

// Direct trigger dispatch only. Physical keys, popup focus and VoiceOver need separate evidence.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('select-keys'))
	ctx.record('initial trigger value', String(ctx.find('select-keys').accessibilityValue))
	await ctx.press('select-keys')
	ctx.record('qualification', 'direct trigger dispatch; no OS key or focus assertion')
}
