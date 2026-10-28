/** @jsxImportSource @octane-xplat/jsx */
import { Grid, Pressable, Screen, Text, View } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'
import './screen-layers.css'

// Maintained by UI contributors for #46: keep the library mounted while
// opening/closing a full-bounds player. No media or consumer app is required.
export default function ScreenLayers() {
	const [playing, setPlaying] = useState(false)
	return (
		<Grid id="layers-host" className="screen-layers-host" rows="*" columns="*">
			<View id="library-layer" row={0} col={0}>
				<Grid id="retained-library" className="screen-layers-library" rows="auto,*" columns="*">
					<Pressable id="open-player" onPress={() => setPlaying(true)}>
						<Text>Open player</Text>
					</Pressable>
					<Text>Retained library</Text>
				</Grid>
			</View>
			{playing && (
				<View id="player-layer" row={0} col={0}>
					<Screen className="screen-layers-screen">
						<Grid id="player-stage" className="screen-layers-stage" rows="*" columns="*">
							<View id="delete-confirmation" row={0} col={0} className="screen-layers-confirmation">
								<Text>Delete this clip?</Text>
								<Pressable id="cancel-delete" onPress={() => setPlaying(false)}>
									<Text>Cancel</Text>
								</Pressable>
							</View>
						</Grid>
					</Screen>
				</View>
			)}
		</Grid>
	)
}

export async function run(ctx: ProbeContext) {
	if (!['web', 'ios', 'android'].includes(ctx.target)) {
		throw new Error('This fixture measures web/iOS/Android window-space geometry only')
	}

	await ctx.waitFor(() => ctx.inspect('layers-host').frame?.height)
	const library = ctx.find('retained-library')
	for (let cycle = 0; cycle < 2; cycle++) {
		await ctx.press('open-player')
		await ctx.waitFor(() => ctx.find('player-stage') && ctx.inspect('player-stage').frame?.height)
		const host = ctx.inspect('layers-host').frame!
		ctx.assert('host has nonzero bounds', host.width > 0 && host.height > 0, true)
		for (const id of ['library-layer', 'player-layer', 'player-stage']) {
			const frame = ctx.inspect(id).frame!
			ctx.record(`${cycle}:${id}`, frame)
			for (const key of ['x', 'y', 'width', 'height'] as const) {
				ctx.assert(`${cycle}:${id}.${key} matches host`, Math.abs(frame[key] - host[key]) < 1, true)
			}
		}

		for (const id of ['delete-confirmation', 'cancel-delete']) {
			const frame = ctx.inspect(id).frame!
			ctx.record(`${cycle}:${id}`, frame)
			ctx.assert(
				`${id} stays within host`,
				frame.width > 0 &&
					frame.height > 0 &&
					frame.x >= host.x - 1 &&
					frame.y >= host.y - 1 &&
					frame.x + frame.width <= host.x + host.width + 1 &&
					frame.y + frame.height <= host.y + host.height + 1,
				true,
			)
		}

		ctx.assert('library remains mounted', ctx.find('retained-library') === library, true)
		await ctx.press('cancel-delete')
		await ctx.waitFor(() => !ctx.find('player-stage'))
		ctx.assert('library survives closing player', ctx.find('retained-library') === library, true)
	}
}
