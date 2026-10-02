/** @jsxImportSource @nativescript-community/octane */
import type { TouchGestureEventData } from '@nativescript/core'
import type { ProbeContext } from '../../scripts/probe/context'

const events: [string, number, number][] = []

export default function TouchSequence() {
	return <stackLayout id="probe-touch" touch={(event: TouchGestureEventData) => {
		events.push([event.action, event.getX(), event.getY()])
	}}>
		<label text="Touch sequence target" />
	</stackLayout>
}

export async function run(ctx: ProbeContext) {
	events.length = 0
	await ctx.waitFor(() => ctx.find('probe-touch')?.isLoaded)
	await ctx.scrub('probe-touch', [{ x: 20, y: 40 }, { x: 80, y: 50 }])

	ctx.assert('touch actions and coordinates', JSON.stringify(events),
		JSON.stringify([['down', 20, 40], ['move', 80, 50], ['up', 80, 50]]))

	ctx.record('touch sequence', events)
}
