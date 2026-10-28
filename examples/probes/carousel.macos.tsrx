/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, Carousel, Text, VStack } from '@octane-xplat/ui'
import type { CarouselHandle } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function CarouselProbe() {
	const carousel = useRef<CarouselHandle | null>(null), [loop, setLoop] = useState(false)
	return <VStack gap={2}>
		<Text>Use Previous/Next and Last to request native scrolling. Check measured proportional widths, gaps, wrapping, vertical position, resize, keyboard/trackpad, reduced motion and nested input/overlay hit testing. The runner synthesizes no native scrolling, input or visual evidence.</Text>
		<Carousel id="carousel-preview" ref={carousel} label="Previews" hasButtons hasLoop={loop} variant="proportional" style={{ width: 320, height: 120 }}>
			<Text>First preview</Text><Text>Second preview</Text><Text>Third preview</Text>
		</Carousel>
		<Button label="Last preview" clickAction={() => carousel.current?.scrollTo(2)} />
		<Button label="Toggle loop" clickAction={() => setLoop(!loop)} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('carousel-preview'))
	ctx.record('qualification', 'fixture mounted only; native layout/geometry/RTL/scroll/animation/input/overlay/AX remain unqualified')
}
