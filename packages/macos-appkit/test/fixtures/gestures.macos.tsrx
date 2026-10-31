/** @jsxImportSource @octane-xplat/jsx */
import { Pressable } from '../../../ui/src/components/actions/Pressable.macos.tsrx'
import { View } from '../../../ui/src/components/layout/View.macos.tsrx'
import { useState } from 'octane'
import {
	NSClickGestureRecognizer,
	NSPanGestureRecognizer,
	NSPressGestureRecognizer,
} from '@octane-xplat/platform/macos'

const events: any[] = []
let disable: (value: boolean) => void
export default function Case() {
	const [disabled, setDisabled] = useState(false)
	disable = setDisabled
	return (
		<View id="swipe-view" onSwipe={(e) => events.push(['view-swipe', e.direction])}>
			<Pressable
				id="press"
				disabled={disabled}
				style={{ width: 160, height: 80 }}
				onPress={() => events.push('press')}
				onPressIn={() => events.push('in')}
				onPressOut={() => events.push('out')}
				onLongPress={() => events.push('long')}
				onDoublePress={() => events.push('double')}
				onPan={(e) => events.push(['pan', e.state])}
				onSwipe={(e) => events.push(['swipe', e.direction])}
			/>
		</View>
	)
}

function recognizers(view: any) {
	const list = view.gestureRecognizers
	return Array.from({ length: Number(list.count) }, (_, i) => list.objectAtIndex(i)) as any[]
}

function invoke(r: any, state = 3) {
	// AppKit's public recognizer state is read-only. Shadow it for target dispatch;
	// this fixture does not simulate the OS recognizer state machine.
	Object.defineProperty(r, 'state', { value: state, configurable: true })
	r.target.performSelectorWithObject(r.action, r)
	delete r.state
}

export async function run(ctx: any) {
	await ctx.waitFor(() => ctx.find('press'))
	const view = ctx.find('press'),
		list = recognizers(view)

	ctx.assert('five native recognizers', list.length, 5)
	const click = list.find(
		(r) => r instanceof NSClickGestureRecognizer && Number(r.numberOfClicksRequired) === 1,
	)

	const double = list.find(
		(r) => r instanceof NSClickGestureRecognizer && Number(r.numberOfClicksRequired) === 2,
	)

	const long = list.find((r) => r instanceof NSPressGestureRecognizer)
	const pan = list.find((r) => r instanceof NSPanGestureRecognizer)
	const touch = list.find(
		(r) =>
			!(r instanceof NSClickGestureRecognizer) &&
			!(r instanceof NSPressGestureRecognizer) &&
			!(r instanceof NSPanGestureRecognizer),
	)

	ctx.assert('long press duration', Number(long.minimumPressDuration), 0.5)
	ctx.assert(
		'coexistence on host',
		Boolean(
			touch.delegate.gestureRecognizerShouldRecognizeSimultaneouslyWithGestureRecognizer(
				touch,
				pan,
			),
		),
		true,
	)

	// Direct native responder/target dispatch validates bridge contracts, not OS hit-testing.
	touch.performSelectorWithObject('mouseDown:', null)
	touch.performSelectorWithObject('mouseUp:', null)
	invoke(click)
	invoke(double)
	invoke(long)
	ctx.assert(
		'press callbacks',
		JSON.stringify(events),
		JSON.stringify(['in', 'out', 'press', 'double', 'long']),
	)

	touch.performSelector('reset')
	touch.performSelectorWithObject('mouseDown:', null)
	touch.performSelector('reset')
	ctx.assert(
		'balanced cancellation',
		JSON.stringify(events.slice(-2)),
		JSON.stringify(['in', 'out']),
	)

	pan.setTranslationInView({ x: 50, y: 0 }, view)
	invoke(pan)
	ctx.assert('normalized pan', JSON.stringify(events.at(-2)), JSON.stringify(['pan', 'ended']))
	ctx.assert('swipe delivery', JSON.stringify(events.at(-1)), JSON.stringify(['swipe', 1]))
	pan.setTranslationInView({ x: 50, y: 0 }, view)
	invoke(pan, 4)
	ctx.assert(
		'pan cancellation',
		JSON.stringify(events.at(-1)),
		JSON.stringify(['pan', 'cancelled']),
	)

	const outer = ctx.find('swipe-view'),
		outerPan = recognizers(outer).find((r) => r instanceof NSPanGestureRecognizer)

	outerPan.setTranslationInView({ x: -50, y: 0 }, outer)
	invoke(outerPan)
	ctx.assert('View swipe', JSON.stringify(events.at(-1)), JSON.stringify(['view-swipe', 2]))
	disable(true)
	await ctx.waitFor(() => !pan.enabled)
	const before = events.length
	invoke(click)
	invoke(double)
	invoke(long)
	touch.performSelectorWithObject('mouseDown:', null)
	touch.performSelector('reset')
	invoke(pan)
	ctx.assert('disabled suppresses queued callbacks', events.length, before)
	ctx.assert('disabled accessibility', Boolean(view.isAccessibilityEnabled()), false)
	disable(false)
	await ctx.waitFor(() => Boolean(pan.enabled))
	invoke(double)
	ctx.assert('reenabled callback', events.at(-1), 'double')
	ctx.record('interaction', 'native recognizer responder/target dispatch; no OS input')
}
