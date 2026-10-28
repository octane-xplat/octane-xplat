/** @jsxImportSource @nativescript-community/octane */
import { Carousel } from '../src/Carousel'
import { View } from '../src/View'
import { Text } from '../src/Text'
import type { CarouselHandle } from '../src/props'
import type { ProbeContext } from '../../../scripts/probe/context'

let handle: CarouselHandle | null = null

export default function CarouselPaging() @{
	<Carousel
		id="paging-carousel"
		ref={(value: CarouselHandle | null) => {
			handle = value
		}}
		variant="proportional"
		style={{ width: 320, height: 120 }}
	>
		<View id="paging-page-0" style={{ flexGrow: 1 }}>
			<Text>{'page 0'}</Text>
		</View>
		<View id="paging-page-1" style={{ flexGrow: 1 }}>
			<Text>{'page 1'}</Text>
		</View>
		<View id="paging-page-2" style={{ flexGrow: 1 }}>
			<Text>{'page 2'}</Text>
		</View>
	</Carousel>
}

export async function run(ctx: ProbeContext) {
	await ctx.mount(CarouselPaging)
	await ctx.waitFor(() => handle && (ctx.inspect('paging-page-2').frame?.width ?? 0) > 0)
	const page = (n: number) => ctx.inspect('paging-page-' + n).frame!
	const offset = (n: number) =>
		ctx.find('paging-page-' + n).getLocationRelativeTo(ctx.find('paging-carousel')).x

	const aligned = (n: number) => Math.abs(offset(n)) <= 2
	ctx.record('initial', { pages: [0, 1, 2].map(page), offsets: [0, 1, 2].map(offset) })
	ctx.assert('proportional slides are one viewport wide', Math.abs(page(0).width - 320) <= 2, true)
	ctx.assert('slides overflow the viewport', handle!.canScrollNext(), true)
	handle!.scrollTo(2)
	await ctx.waitFor(() => aligned(2), { timeout: 5000, interval: 20 })
	ctx.assert('scrollTo aligns the last slide with the viewport', aligned(2), true)
	await ctx.waitFor(() => !handle!.canScrollNext(), { timeout: 2000, interval: 20 })
	ctx.assert('last slide reports the end', handle!.canScrollNext(), false)
	handle!.scrollTo(0)
	await ctx.waitFor(() => aligned(0), { timeout: 5000, interval: 20 })
	ctx.assert('scrollTo returns to the first slide', aligned(0), true)
	ctx.record('returned', { pages: [0, 1, 2].map(page), offsets: [0, 1, 2].map(offset) })
}
