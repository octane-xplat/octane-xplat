/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import type { UniversalComponent } from 'octane/universal'
import { NSView } from '@octane-xplat/platform/macos'
import type { NSWindow } from '@octane-xplat/platform/macos'
import { Text } from '@octane-xplat/ui'
import { defineAppKitTransition } from '@octane-xplat/ui/macos'
import {
	createRouter,
	createPaneRouterHost,
	defineRoute,
	defineRoutes,
	defineTransitions,
	RouterPane,
} from '@octane-xplat/ui/routing'

import type { RouteScreenProps } from '@octane-xplat/ui/routing'

const item = defineRoute({ path: '/motion/:id' })
function Item(props: RouteScreenProps<typeof item>): any {
	return <Text id={'motion-' + props.params.id}>{props.params.id}</Text>
}

function makeRouter() {
	const directions: string[] = []
	const host = createPaneRouterHost()
	const navigation = createRouter({
		catalog: defineRoutes([item.screen(Item)]),
		host: host.host,
		stacks: ['other'],
		transitions: defineTransitions({
			detail: defineAppKitTransition({
				from({ direction, action }) {
					directions.push(direction + ':' + action)
					return { opacity: 0.2, translateX: direction === 'back' ? -40 : 40 }
				},
				duration: 240,
				reducedMotion: 'allow',
			}),
			broken: defineAppKitTransition({
				from() {
					throw new Error('expected animation failure')
				},
				reducedMotion: 'allow',
			}),
		}),
	})
	host.attach(navigation)
	return { host, navigation, directions }
}

function Panes(props: ReturnType<typeof makeRouter>): any {
	return (
		<>
			<RouterPane host={props.host} router={props.navigation}>
				<Text id="motion-base">Base</Text>
			</RouterPane>
			<RouterPane host={props.host} router={props.navigation} stack="other">
				<Text>Other</Text>
			</RouterPane>
		</>
	)
}

/** Real NSView samples; no screenshots or OS input. */
export async function qualifyAppKitRouteTransitions(
	window: NSWindow,
	check: (pass: boolean, name: string) => void,
	until: (predicate: () => boolean, name: string) => Promise<void>,
) {
	const nativeHost = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 640, height: 480 },
	})
	window.contentView = nativeHost
	const root = createMacOSRoot(nativeHost)
	const fixture = makeRouter()
	// The universal compiler supplies the component brand during this build.
	root.render(Panes as unknown as UniversalComponent<ReturnType<typeof makeRouter>>, fixture)
	const pane = (id: string): NSView =>
		(root as typeof root & { __macosDebug: { findId(id: string): NSView } }).__macosDebug.findId(
			'motion-' + id,
		).superview
	const push = (id: string, transition: 'detail' | 'broken' | 'none' = 'detail') =>
		fixture.navigation.push({ to: '/motion/:id', params: { id }, transition })
	try {
		await until(
			() =>
				fixture.navigation.getSnapshot().route === null &&
				!!(root as any).__macosDebug.findId('motion-base'),
			'AppKit motion outlet mounted',
		)

		const first = await push('first')
		check(first.status === 'committed', 'AppKit custom effect commits')
		if (first.status !== 'committed') {
			throw new Error('No first commit')
		}

		check(Number(pane('first').alphaValue) < 1, 'AppKit navigation settles before animation')
		await until(
			() => Number(pane('first').alphaValue) > 0.2 && Number(pane('first').alphaValue) < 1,
			'AppKit incoming view has an intermediate opacity',
		)

		check((await first.finished).status === 'completed', 'AppKit custom effect completes')
		check(
			Number(pane('first').alphaValue) === 1 &&
				Number(pane('first').layer.valueForKeyPath('transform.translation.x')) === 0,
			'AppKit effect restores the native wrapper',
		)

		const retained = pane('first')
		const second = await push('second')
		if (second.status !== 'committed') {
			throw new Error('No second commit')
		}

		const back = await fixture.navigation.back()
		check(back.status === 'committed', 'AppKit Back commits during an effect')
		check(
			(await second.finished).status === 'skipped',
			'AppKit replacement interrupts the previous effect',
		)

		if (back.status !== 'committed') {
			throw new Error('No Back commit')
		}

		check(pane('first') === retained, 'AppKit Back retains its incoming view identity')
		check(
			fixture.directions.at(-1) === 'back:back' &&
				Number(retained.layer.valueForKeyPath('transform.translation.x')) < 0,
			'AppKit Back uses the leaving definition and reverse direction',
		)

		check((await back.finished).status === 'completed', 'AppKit reverse effect completes')
		const failed = await push('failure', 'broken')
		check(
			failed.status === 'committed' && (await failed.finished).status === 'failed',
			'AppKit animation failure preserves the navigation commit',
		)

		const a = await push('isolated')
		const b = await fixture.navigation
			.forStack('other')
			.push({ to: '/motion/:id', params: { id: 'other' }, transition: 'detail' })

		if (a.status !== 'committed' || b.status !== 'committed') {
			throw new Error('No independent effect commit')
		}

		check(
			(await a.finished).status === 'completed' && (await b.finished).status === 'completed',
			'AppKit pane animations settle independently',
		)

		const exiting = await push('dispose')
		if (exiting.status !== 'committed') {
			throw new Error('No disposal commit')
		}

		const disposedView = pane('dispose')
		root.unmount()
		check(
			(await exiting.finished).status === 'skipped',
			'AppKit outlet disposal settles active animation',
		)

		check(
			Number(disposedView.alphaValue) === 1 &&
				Number(disposedView.layer.valueForKeyPath('transform.translation.x')) === 0,
			'AppKit disposal restores retained native values',
		)
	} finally {
		root.unmount()
		fixture.navigation.dispose()
	}
}
