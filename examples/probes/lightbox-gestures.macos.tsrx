/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Lightbox, Text, TextInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function LightboxGestureProbe() {
	const [first, setFirst] = useState(''), [second, setSecond] = useState(''), [open, setOpen] = useState(false), [index, setIndex] = useState(0), [zoom, setZoom] = useState(true)
	return <VStack id="lightbox-gesture-controls" gap={2}>
		<TextInput label="First image source" value={first} onChange={setFirst} />
		<TextInput label="Second image source" value={second} onChange={setSecond} />
		<Button label="Open image gallery" isDisabled={!first || !second} clickAction={() => { setIndex(0); setOpen(true) }} />
		<Button label="Toggle image zoom" clickAction={() => setZoom((value) => !value)} />
		<Text>Current index: {index}. No gallery/media loads until sources are entered and opened.</Text>
		<Lightbox id="gesture-gallery" isOpen={open} onOpenChange={setOpen} index={index} onIndexChange={setIndex} hasZoom={zoom}
			media={[{ src: first, alt: 'First image', caption: 'First image' }, { src: second, alt: 'Second image', caption: 'Second image' }]} />
		<Text>Manual native qualification only: double-click/pinch zoom, image reset, pointer swipe, recognized trackpad swipe, zoomed panning, edge behavior, foreign window/popup isolation and close cleanup. Mounting proves none.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('lightbox-gesture-controls'))
	ctx.record('qualification', 'Lightbox gesture controls mounted; gallery not opened and native input unqualified')
}
