/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Image, clearImageCaches, evictImage, initializeImageCache, isImageCached, prefetch } from '@octane-xplat/image'
import { Button, Text, TextInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function AppKitCachedImageProbe() {
	const active = useRef(true), [source, setSource] = useState('https://example.com/photo.png')
	const [bypass, setBypass] = useState(false), [shown, setShown] = useState(false), [status, setStatus] = useState('not requested')
	useEffect(() => () => { active.current = false }, [])
	const report = (value: string) => { if (active.current) setStatus(value) }
	return <VStack gap={2}>
		<Text>Manual AppKit cache qualification. Enter a cacheable public image URL. Warm while hidden, query disk, then show/query memory. Toggle cache bypass on the same mounted source: it should use new uncached transport without reading/writing owned caches. Toggle back, remove/show, evict/clear, change URL and repeat across launch. Uncacheable responses may display but report unsuccessful prefetch. Check disk failure/cancellation/current request ownership separately. No runtime behavior is qualified by mounting.</Text>
		<TextInput id="appkit-cache-source" label="Public HTTP(S) image URL" value={source} onChange={setSource} />
		{shown ? <Image src={source} cachePolicy={bypass ? 'none' : 'memory-disk'} alt="Cached preview" style={{ width: 160, height: 100 }} /> : null}
		<Button label="Initialize default cache" clickAction={() => { initializeImageCache(); report('initialization requested') }} />
		<Button label="Prefetch bytes without displaying" clickAction={async () => { const owned = source; report(`prefetch: ${await prefetch(owned)}`) }} />
		<Button label="Query source" clickAction={async () => { const owned = source; report(`cached: ${(await isImageCached(owned))[owned]}`) }} />
		<Button label="Toggle cache bypass" clickAction={() => setBypass(!bypass)} />
		<Button label="Toggle preview" clickAction={() => setShown(!shown)} />
		<Button label="Evict source" clickAction={async () => { const owned = source; report(`evicted: ${await evictImage(owned)}`) }} />
		<Button label="Clear image-owned caches" clickAction={async () => { try { await clearImageCaches(); report('clear completed') } catch { report('clear failed') } }} />
		<Text>{status}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('appkit-cache-source'))
	ctx.record('qualification', 'controls mounted only; no prefetch/network/disk/decode/native retention/cancellation or packaging qualification')
}
