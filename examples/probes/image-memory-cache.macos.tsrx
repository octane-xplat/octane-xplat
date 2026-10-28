/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Image, Text, VStack } from '@octane-xplat/ui'
import { appKitHost } from '../../packages/ui/src/host-bridge'
import type { ProbeContext } from '../../scripts/probe/context'
const source = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/mkAAAAASUVORK5CYII='
export default function ImageMemoryCacheProbe() {
	const [shown, setShown] = useState(true), [status, setStatus] = useState('not queried')
	const query = () => { const cache = appKitHost()?.imageMemoryCache; setStatus(cache ? String(cache.isCached(source)) : 'memory bridge unavailable') }
	return <VStack gap={2}>
		<Text>Private renderer memory-cache fixture. Wait for the image, query, evict or clear, and query again. Mounted images should remain; hide/show starts a later load. This does not exercise public image-cache APIs, disk/HTTP invalidation or privacy purge. Native delivery/retention and packaging are unqualified.</Text>
		{shown ? <Image id="image-memory-preview" src={source} alt="Memory cache preview" style={{ width: 48, height: 48 }} /> : null}
		<Button label="Query decoded memory" clickAction={query} />
		<Button label="Evict this decoded image" clickAction={() => { appKitHost()?.imageMemoryCache?.evict(source); query() }} />
		<Button label="Clear decoded images" clickAction={() => { appKitHost()?.imageMemoryCache?.clear(); query() }} />
		<Button label="Toggle mounted image" clickAction={() => setShown(!shown)} /><Text>Cached: {status}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('image-memory-preview'))
	ctx.record('qualification', 'mounted only; native decode/cache retention/HTTP/disk/responsiveness and packaging remain unqualified')
}
