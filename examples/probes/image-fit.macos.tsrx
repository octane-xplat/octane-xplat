/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Image, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

// Deliberately non-square, asymmetric artwork; no external download required.
const artwork = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80"><rect width="160" height="80" fill="#6482b8"/><rect width="40" height="80" fill="#bd5252"/><circle cx="130" cy="40" r="20" fill="#efd369"/></svg>'
export default function ImageFitProbe() {
	const [fit, setFit] = useState<'cover' | 'contain'>('cover')
	const [corner, setCorner] = useState<'top left' | 'bottom right'>('top left')
	return <VStack gap={2}>
		<Image id="fit-image" src={artwork} alt="Asymmetric fit sample" contentFit={fit}
			contentPosition={corner} style={{ width: 120, height: 120, backgroundColor: '#172033' }} />
		<Button id="fit-toggle" label="Toggle cover/contain" clickAction={() => setFit((value) => value === 'cover' ? 'contain' : 'cover')} />
		<Button id="position-toggle" label="Toggle corner" clickAction={() => setCorner((value) => value === 'top left' ? 'bottom right' : 'top left')} />
		<Text id="fit-state">{fit + ' · ' + corner}</Text>
	</VStack>
}

// Nonvisual state/metadata only. This cannot prove cropping, orientation or
// pixels, and no runtime execution is authorized by retaining this fixture.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('fit-image')?.image)
	ctx.assert('initial fit state', ctx.find('fit-state')?.stringValue, 'cover · top left')
	await ctx.press('fit-toggle')
	await ctx.waitFor(() => ctx.find('fit-state')?.stringValue === 'contain · top left')
	await ctx.press('position-toggle')
	await ctx.waitFor(() => ctx.find('fit-state')?.stringValue === 'contain · bottom right')
	const image = ctx.find('fit-image')
	ctx.record('view size', { width: Number(image.bounds.size.width), height: Number(image.bounds.size.height) })
	ctx.record('logical image size', { width: Number(image.image.size.width), height: Number(image.image.size.height) })
}
