import { Image, isImageCached, prefetch } from '@octane-xplat/image'
import { Text, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'

const FIRST = 'https://picsum.photos/seed/probe-a/400/240'
const SECOND = 'https://picsum.photos/seed/probe-b/400/240'
const PREFETCHED = 'https://picsum.photos/seed/probe-c/400/240'
const NEVER = 'https://picsum.photos/seed/probe-d/400/240'

// Explicit decode bounds give the display load a deterministic iOS cache
// key — SDWebImage folds the decode transformer into it — so isImageCached
// can probe the exact key below.
const DECODE = { decodeWidth: 400, decodeHeight: 240 } as const

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
			decodeWidth={DECODE.decodeWidth}
			decodeHeight={DECODE.decodeHeight}
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

	const displayed = await isImageCached(FIRST, DECODE)
	const bareDisplayed = await isImageCached(FIRST)
	const states = await isImageCached([FIRST, SECOND, NEVER], DECODE)
	ctx.record('displayedWithDecodeContext', displayed)
	// iOS keys transformed entries by decode context — the bare probe misses
	// the decoded memory entry the options probe finds. Recorded, not
	// asserted: the original-bytes presence is SDWebImage-version behavior.
	ctx.record('displayedBareKey', bareDisplayed)
	ctx.record('batchStates', states)
	ctx.assert(
		'batch reports every requested URL',
		Object.keys(states).sort().join(),
		[FIRST, SECOND, NEVER].sort().join(),
	)

	if (ctx.target === 'android' || ctx.target === 'ios') {
		const source = events[2].split(':')[1]
		ctx.assert('reload served from engine cache', source === 'memory' || source === 'disk', true)
		ctx.assert('never-loaded URL reports none', states[NEVER], 'none')

		if (ctx.target === 'ios') {
			// The display load decoded into memory under a key that includes the
			// decode bounds — the options probe must match it (iOS was reporting
			// 'none' when the probe dropped the transform context).
			ctx.assert('displayed image reports memory with decode context', displayed[FIRST], 'memory')
		} else {
			// Android keys probes on the URL through EvictionManager, which
			// cannot see Glide's active resources — the still-displayed bitmap
			// can report 'none'. The swapped-away image sits in the memory LRU
			// and is the stable cached signal.
			ctx.assert('evicted-to-LRU image reports memory', states[SECOND], 'memory')
		}

		// prefetch warms the untransformed key — a bare probe reports it.
		ctx.assert('prefetch succeeds', await prefetch(PREFETCHED), true)
		const prefetched = await isImageCached(PREFETCHED)
		ctx.record('prefetchedState', prefetched)
		ctx.assert('prefetched image reports cached', prefetched[PREFETCHED] !== 'none', true)
		ctx.assert('disk prefetch does not warm memory', prefetched[PREFETCHED], 'disk')
	} else {
		// web/macos have no queryable cache — every URL reports 'none'.
		ctx.assert('cold URL reports none', states[NEVER], 'none')
		ctx.assert('non-native probes report none', states[FIRST], 'none')
	}

	ctx.record('frame', ctx.inspect('probe-image').frame)
	ctx.record('events', [...events])
}
