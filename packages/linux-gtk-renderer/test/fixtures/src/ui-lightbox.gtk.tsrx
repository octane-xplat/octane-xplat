/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Lightbox, Text, View, useLightbox } from '@octane-xplat/ui'
import type { LightboxMedia } from '@octane-xplat/ui'

const PNG_2x2 =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVR4nGO4o6HxHxkzkC4AAJiYIrGEgq7pAAAAAElFTkSuQmCC'

export const LIGHTBOX_MEDIA: LightboxMedia[] = [
	{ src: PNG_2x2, type: 'image', alt: 'first slide', caption: 'Caption A' },
	{ src: PNG_2x2, type: 'image', alt: 'second slide' },
	{ src: PNG_2x2, type: 'image', alt: 'third slide' },
]

export function LightboxProbe() @{
	const [open, setOpen] = useState(false)
	const [index, setIndex] = useState(0)
	const [mark, setMark] = useState('none')
	const hook = useLightbox({
		media: LIGHTBOX_MEDIA,
		onIndexChange: (i) => setMark('hook-idx:' + i),
	})

	<View style={{ flexDirection: 'column' }}>
		<Button id="lb-open" label="Open" clickAction={() => setOpen(true)} />
		<Button id="lb-next-ctl" label="NextCtl" clickAction={() => setIndex(index + 1)} />
		<Button id="hook-open" label="HookOpen" clickAction={() => hook.open(2)} />
		<Text id="picked">{mark}</Text>
		<Lightbox
			isOpen={open}
			onOpenChange={(o) => {
				if (!o) {
					setOpen(false)
					setMark('ctl-closed')
				}
			}}
			media={LIGHTBOX_MEDIA}
			index={index}
			onIndexChange={(i) => {
				setIndex(i)
				setMark('idx:' + i)
			}}
			hasZoom={true}
		/>
		{hook.element}
	</View>
}
