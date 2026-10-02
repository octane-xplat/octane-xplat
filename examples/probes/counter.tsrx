import { VStack, Pressable, Text } from '@octane-xplat/ui'
import { useSignal$ } from 'octane/signals/client'
import type { ProbeContext } from '../../scripts/probe/context'

export default function Counter() {
	const count$ = useSignal$(0)
	return <VStack>
		<Text id="probe-count">{String(count$.get())}</Text>
		<Pressable id="probe-increment" onPress={() => count$.set(count$.get() + 1)}>
			<Text>Increment</Text>
		</Pressable>
	</VStack>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('probe-increment'))
	ctx.assert('initial count', ctx.inspect('probe-count').text, '0')
	await ctx.press('probe-increment')
	await ctx.waitFor(() => ctx.inspect('probe-count').text === '1')
	ctx.assert('count after press', ctx.inspect('probe-count').text, '1')
	ctx.record('label', ctx.inspect('probe-count'))
}
