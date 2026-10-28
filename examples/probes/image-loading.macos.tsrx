/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, HStack, Image, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/mkAAAAASUVORK5CYII='
export default function ImageLoadingProbe() {
	const [second, setSecond] = useState(true)
	return <VStack gap={2}>
		<HStack>
			<Image id="image-first" src={pixel} alt="First image" flexGrow={1}
				contentFit="contain" className={['image-frame', { selected: second }]}
				style={{ width: 48, height: 48 }} />
			{second ? <Image id="image-second" src={pixel} alt="Second image" flexGrow={1}
				contentFit="contain" style="width:48px;height:48px" /> : null}
		</HStack>
		<Button id="toggle-image" label="Toggle second image" clickAction={() => setSecond((value) => !value)} />
		<Text>Both views use one source. Toggle the second view to exercise removal and reuse.</Text>
	</VStack>
}

// Nonvisual state only. This does not establish pixels, network delivery,
// native threading or responsiveness; every runtime run needs authorization.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('image-first')?.image && ctx.find('image-second')?.image)
	ctx.record('initial image objects present', true)
	await ctx.press('toggle-image')
	await ctx.waitFor(() => !ctx.find('image-second'))
	ctx.assert('first image survives sibling removal', Boolean(ctx.find('image-first')?.image), true)
	await ctx.press('toggle-image')
	await ctx.waitFor(() => ctx.find('image-second')?.image)
	ctx.record('second image object restored', true)
}
