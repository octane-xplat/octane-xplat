import { Image } from '@octane-xplat/image'
import { Text, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'

const FIRST = 'https://picsum.photos/seed/probe-a/400/240'
const SECOND = 'https://picsum.photos/seed/probe-b/400/240'

const events: string[] = []
let swap: (value: boolean) => void

export default function CachedImageProbe() {
	const [second, setSecond] = useState(false)
	swap = setSecond
	const src = second ? SECOND : FIRST
	return <VStack>
		<Text id="probe-label">{src}</Text>
		<Image
			id="probe-image"
			src={src}
			alt="probe"
			contentFit="cover"
			style={{ width: 200, height: 120 }}
			onLoad={(e) => events.push(`load:${e.source ?? 'browser'}:${e.width}x${e.height}`)}
			onError={(e) => events.push(`error:${String(e.error)}`)}
		/>
	</VStack>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('probe-image'))
	await ctx.waitFor(() => events.length >= 1, { timeout: 45000 })
	ctx.assert('first load finished', events[0].startsWith('load:'), true)
	ctx.record('firstLoad', events[0])

	// Swap to a second URL and back — the reload of FIRST must be served by
	// the engine's memory/disk cache on native (never the network twice).
	swap(true)
	await ctx.waitFor(() => events.length >= 2, { timeout: 45000 })
	ctx.record('secondLoad', events[1])
	swap(false)
	await ctx.waitFor(() => events.length >= 3, { timeout: 45000 })
	ctx.record('reload', events[2])

	if (ctx.target === 'android' || ctx.target === 'ios') {
		const source = events[2].split(':')[1]
		ctx.assert('reload served from engine cache', source === 'memory' || source === 'disk', true)
	}

	ctx.record('frame', ctx.inspect('probe-image').frame)
	ctx.record('events', [...events])
}
