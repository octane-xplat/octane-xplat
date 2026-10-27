/** @jsxImportSource @nativescript-community/octane */
import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'
import { Lightbox } from '@octane-xplat/lightbox'

const media = [
	{ src: 'https://picsum.photos/seed/ma1/800/600', alt: 'one', width: 800, height: 600 },
	{ src: 'https://picsum.photos/seed/ma2/600/600', alt: 'two', width: 600, height: 600 },
	{ src: 'https://picsum.photos/seed/ma3/900/300', alt: 'three', width: 900, height: 300 },
]

export default function LightboxGallery() {
	const [open, setOpen] = useState(false)
	const [index, setIndex] = useState(0)
	return (
		<VStack className="maestro-screen">
			<Text>Maestro lightbox</Text>
			<Text>{`state: ${open ? 'open' : 'closed'}:${index}`}</Text>
			<Lightbox.Root media={media} isOpen={open} onOpenChange={setOpen} onIndexChange={setIndex}>
				<Lightbox.Trigger index={0} testID="lb-trigger-0"><masonview width={160} height={100} backgroundColor="#a33" /></Lightbox.Trigger>
				<Lightbox.Trigger index={1} testID="lb-trigger-1"><masonview width={160} height={100} backgroundColor="#3a3" /></Lightbox.Trigger>
				<Lightbox.Trigger index={2} testID="lb-trigger-2"><masonview width={160} height={100} backgroundColor="#337" /></Lightbox.Trigger>
				<Lightbox.Popup testID="lb-popup">
					<Lightbox.Backdrop testID="lb-backdrop" />
					<Lightbox.Viewport>
						{media.map((_, i) => (
							<Lightbox.Slide key={i} index={i}><Lightbox.Image /></Lightbox.Slide>
						))}
					</Lightbox.Viewport>
					<Lightbox.Close testID="lb-close"><Text>{'close'}</Text></Lightbox.Close>
				</Lightbox.Popup>
			</Lightbox.Root>
		</VStack>
	)
}
